# app/api/v1/reports.py
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Optional
from sqlmodel import Session, select, func
from sqlalchemy import case
from datetime import datetime, timedelta, date

from app.core.security import get_current_user
from app.db.session import SessionLocal
from app.models.transaction import Transaction

# Optional Category model (name lookup for pie charts)
try:
    from app.models.category import Category  # expected fields: id, name
except Exception:  # pragma: no cover
    Category = None  # type: ignore

router = APIRouter()


# ---------------------- DB session dep ----------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------- Helpers ----------------------
def _today() -> date:
    # Use naive UTC date to match typical SQLite naive datetimes
    return datetime.utcnow().date()

def _start_of_day(d: date) -> datetime:
    return datetime.combine(d, datetime.min.time())

def _end_of_day(d: date) -> datetime:
    return datetime.combine(d, datetime.max.time())

def _start_of_month(d: date) -> date:
    return d.replace(day=1)

def _end_of_month(d: date) -> date:
    if d.month == 12:
        return date(d.year, 12, 31)
    first_next = date(d.year, d.month + 1, 1)
    return first_next - timedelta(days=1)

def _month_add(d: date, months: int) -> date:
    y = d.year + (d.month - 1 + months) // 12
    m = (d.month - 1 + months) % 12 + 1
    day = min(d.day, [31, 29 if y % 4 == 0 and (y % 100 != 0 or y % 400 == 0) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m-1])
    return date(y, m, day)

def _date_range(start: date, end: date) -> List[date]:
    cur = start
    out = []
    while cur <= end:
        out.append(cur)
        cur = cur + timedelta(days=1)
    return out

def _last_n_month_keys(n: int) -> List[str]:
    """
    Returns last n months INCLUDING current, as ISO YYYY-MM in chronological order.
    Example: ["2025-04","2025-05","...","2025-08"]
    """
    end_month = _today().replace(day=1)
    desc = []
    cur = end_month
    for _ in range(n):
        desc.append(f"{cur.year:04d}-{cur.month:02d}")
        cur = _month_add(cur, -1)
    return list(reversed(desc))


# ---------------------- Core building blocks ----------------------
def _income_sum_expr():
    return func.sum(case((func.lower(Transaction.type) == "income", Transaction.amount), else_=0.0))

def _expense_sum_expr():
    return func.sum(case((func.lower(Transaction.type) == "expense", Transaction.amount), else_=0.0))


# =================================================================
#                 CHART / VISUALIZATION ENDPOINTS
# =================================================================

# ---------- DAILY SERIES (income, expense, net) ----------
@router.get("/reports/series/daily")
def series_daily(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
    days: int = Query(30, ge=1, le=180),
):
    """
    Line/area chart over last `days` (default 30).
    Returns per-day income (>=0), expense (>=0), and net = income - expense.
    """
    end_d = _today()
    start_d = end_d - timedelta(days=days - 1)

    day_label = func.strftime("%Y-%m-%d", Transaction.date).label("day")
    inc_sum = _income_sum_expr().label("income")
    exp_sum = _expense_sum_expr().label("expense")

    stmt = (
        select(day_label, inc_sum, exp_sum)
        .where(
            Transaction.user_id == current_user,
            Transaction.date >= _start_of_day(start_d),
            Transaction.date <= _end_of_day(end_d),
        )
        .group_by(day_label)
    )
    rows = db.execute(stmt).all()  # [(day, income, expense), ...]

    by_day: Dict[str, Dict[str, float]] = {d: {"income": float(i or 0), "expense": float(e or 0)} for d, i, e in rows}

    series = []
    for d in _date_range(start_d, end_d):
        key = d.isoformat()
        income = by_day.get(key, {}).get("income", 0.0)
        expense = by_day.get(key, {}).get("expense", 0.0)
        series.append({
            "date": key,
            "income": round(income, 2),
            "expense": round(expense, 2),
            "net": round(income - expense, 2),
        })

    return {"range": {"start": start_d.isoformat(), "end": end_d.isoformat()}, "series": series}


# ---------- MONTHLY SERIES (income, expense, net) ----------
@router.get("/reports/series/monthly")
def series_monthly(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
    months: int = Query(12, ge=1, le=36),
):
    """
    Bar/stacked chart over last `months` (default 12).
    Returns per-month income (>=0), expense (>=0), and net = income - expense.
    """
    ym = func.strftime("%Y-%m", Transaction.date).label("ym")
    inc_sum = _income_sum_expr().label("income")
    exp_sum = _expense_sum_expr().label("expense")

    stmt = (
        select(ym, inc_sum, exp_sum)
        .where(Transaction.user_id == current_user)
        .group_by(ym)
        .order_by(ym)
    )
    rows = db.execute(stmt).all()  # [(ym, income, expense), ...]

    # Keep only last N months (chronological)
    wanted = set(_last_n_month_keys(months))
    filtered = [r for r in rows if r[0] in wanted]

    # Fill missing months with zeros
    series_map = {ym_val: {"income": float(i or 0), "expense": float(e or 0)} for ym_val, i, e in filtered}
    out = []
    for key in _last_n_month_keys(months):
        inc = series_map.get(key, {}).get("income", 0.0)
        exp = series_map.get(key, {}).get("expense", 0.0)
        out.append({
            "month": key,
            "income": round(inc, 2),
            "expense": round(exp, 2),
            "net": round(inc - exp, 2),
        })

    return {"series": out}


# ---------- CATEGORY PIE / DONUT ----------
@router.get("/reports/pie/categories")
def categories_pie(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
    year: Optional[int] = None,
    month: Optional[int] = None,
    type: str = Query("expense", pattern="^(income|expense)$"),
):
    """
    Pie/Donut: totals by category for a given year-month (defaults to current month), filtered by type.
    Returns array of {category_id, category_name, value}.
    """
    today = _today()
    year = year or today.year
    month = month or today.month

    start_dt = _start_of_day(date(year, month, 1))
    end_dt = _end_of_day(_end_of_month(date(year, month, 1)))

    base = (
        select(func.sum(Transaction.amount).label("total"), Transaction.category_id)
        .where(
            Transaction.user_id == current_user,
            func.lower(Transaction.type) == type,
            Transaction.date >= start_dt,
            Transaction.date <= end_dt,
        )
        .group_by(Transaction.category_id)
    )

    if Category is not None:
        # Join to Category to get names
        stmt = (
            select(func.sum(Transaction.amount).label("total"), Transaction.category_id, Category.name)
            .where(
                Transaction.user_id == current_user,
                func.lower(Transaction.type) == type,
                Transaction.category_id == Category.id,
                Transaction.date >= start_dt,
                Transaction.date <= end_dt,
            )
            .group_by(Transaction.category_id, Category.name)
        )
        rows = db.execute(stmt).all()
        slices = [{
            "category_id": cid,
            "category_name": cname or "Uncategorized",
            "value": round(float(total or 0), 2),
        } for (total, cid, cname) in rows]
    else:
        rows = db.execute(base).all()
        slices = [{
            "category_id": cid,
            "category_name": f"Category {cid}" if cid is not None else "Uncategorized",
            "value": round(float(total or 0), 2),
        } for (total, cid) in rows]

    return {
        "year": year,
        "month": month,
        "type": type,
        "total": round(sum(x["value"] for x in slices), 2),
        "slices": slices,
    }


# ---------- THIS vs LAST MONTH CARDS ----------
@router.get("/reports/summary/cards")
def summary_cards(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """
    Dashboard cards: this_month income/expense/net, last_month income/expense/net, and deltas.
    """
    today = _today()
    this_s = _start_of_month(today)
    this_e = _end_of_month(today)

    last_m = _month_add(this_s, -1)
    last_s = _start_of_month(last_m)
    last_e = _end_of_month(last_m)

    def _sum_between(t_type: str, s: date, e: date) -> float:
        st = (
            select(func.coalesce(func.sum(Transaction.amount), 0.0))
            .where(
                Transaction.user_id == current_user,
                func.lower(Transaction.type) == t_type,
                Transaction.date >= _start_of_day(s),
                Transaction.date <= _end_of_day(e),
            )
        )
        return float(db.execute(st).scalar() or 0.0)

    this_inc = _sum_between("income", this_s, this_e)
    this_exp = _sum_between("expense", this_s, this_e)
    last_inc = _sum_between("income", last_s, last_e)
    last_exp = _sum_between("expense", last_s, last_e)

    return {
        "this_month": {
            "month": f"{this_s:%Y-%m}",
            "income": round(this_inc, 2),
            "expense": round(this_exp, 2),
            "net": round(this_inc - this_exp, 2),
        },
        "last_month": {
            "month": f"{last_s:%Y-%m}",
            "income": round(last_inc, 2),
            "expense": round(last_exp, 2),
            "net": round(last_inc - last_exp, 2),
        },
        "delta": {
            "income": round(this_inc - last_inc, 2),
            "expense": round(this_exp - last_exp, 2),
            "net": round((this_inc - this_exp) - (last_inc - last_exp), 2),
        },
    }


# ---------- MoM COMPARE ----------
@router.get("/reports/compare/mom")
def compare_mom(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
    months: int = Query(6, ge=2, le=24),
):
    """
    Multi-series for bar/line: income vs expense for last N months (chronological).
    """
    ym = func.strftime("%Y-%m", Transaction.date).label("ym")
    inc_sum = _income_sum_expr().label("income")
    exp_sum = _expense_sum_expr().label("expense")

    stmt = (
        select(ym, inc_sum, exp_sum)
        .where(Transaction.user_id == current_user)
        .group_by(ym)
        .order_by(ym)
    )
    rows = db.execute(stmt).all()

    # Limit to requested months; fill missing with 0
    keys = _last_n_month_keys(months)
    mp = {ymv: {"income": float(i or 0), "expense": float(e or 0)} for ymv, i, e in rows if ymv in keys}
    out = [{"month": k,
            "income": round(mp.get(k, {}).get("income", 0.0), 2),
            "expense": round(mp.get(k, {}).get("expense", 0.0), 2)} for k in keys]
    return {"series": out}


# ---------- NAIVE FORECAST (NEXT MONTH) ----------
@router.get("/reports/forecast/next-month")
def forecast_next_month(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
    lookback_months: int = Query(3, ge=2, le=12),
):
    """
    Simple next-month forecast using average of the last `lookback_months`.
    Also returns projected category split for expenses.
    """
    base_months = _last_n_month_keys(lookback_months + 1)[:-1]  # Exclude current month
    # Compute sums per month
    ym = func.strftime("%Y-%m", Transaction.date).label("ym")
    inc_sum = _income_sum_expr().label("income")
    exp_sum = _expense_sum_expr().label("expense")

    stmt = (
        select(ym, inc_sum, exp_sum)
        .where(Transaction.user_id == current_user)
        .group_by(ym)
        .order_by(ym)
    )
    rows = db.execute(stmt).all()
    mp = {ymv: {"inc": float(i or 0), "exp": float(e or 0)} for ymv, i, e in rows if ymv in base_months}

    inc_vals = [mp.get(k, {}).get("inc", 0.0) for k in base_months]
    exp_vals = [mp.get(k, {}).get("exp", 0.0) for k in base_months]
    inc_forecast = round(sum(inc_vals) / max(1, len(inc_vals)), 2)
    exp_forecast = round(sum(exp_vals) / max(1, len(exp_vals)), 2)

    # Category proportions across the lookback window (expenses only)
    if base_months:
        first_m = datetime.strptime(base_months[0] + "-01", "%Y-%m-%d").date()
        last_m = datetime.strptime(base_months[-1] + "-01", "%Y-%m-%d").date()
    else:
        first_m = _today().replace(day=1)
        last_m = first_m

    cat_stmt = (
        select(func.sum(Transaction.amount).label("total"), Transaction.category_id)
        .where(
            Transaction.user_id == current_user,
            func.lower(Transaction.type) == "expense",
            Transaction.date >= _start_of_day(first_m),
            Transaction.date <= _end_of_day(_end_of_month(last_m)),
        )
        .group_by(Transaction.category_id)
    )
    rows = db.execute(cat_stmt).all()
    total_lb = float(sum((r[0] or 0.0) for r in rows)) or 1.0  # avoid div by zero
    by_category = []
    for total, cid in rows:
        share = float(total or 0.0) / total_lb
        name = None
        if Category is not None and cid is not None:
            name = db.exec(select(Category.name).where(Category.id == cid)).first()
        by_category.append({
            "category_id": cid,
            "category_name": name or (f"Category {cid}" if cid is not None else "Uncategorized"),
            "share": round(share, 4),
            "projected_amount": round(exp_forecast * share, 2),
        })

    return {
        "lookback_months": lookback_months,
        "history": {
            "months": base_months,
            "income": [round(x, 2) for x in inc_vals],
            "expense": [round(x, 2) for x in exp_vals],
        },
        "forecast_for": datetime.strftime(_month_add(_today().replace(day=1), +1), "%Y-%m"),
        "forecast": {
            "income": inc_forecast,
            "expense": exp_forecast,
            "net": round(inc_forecast - exp_forecast, 2),
            "by_category": by_category,
        },
    }


# =================================================================
#                    LEGACY/COMPAT ENDPOINTS (IMPROVED)
# =================================================================

# Totals by type with case-insensitive handling
@router.get("/reports/summary")
def summary_report(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
):
    q = select(
        _income_sum_expr().label("income"),
        _expense_sum_expr().label("expense"),
    ).where(Transaction.user_id == current_user)

    if start_date:
        q = q.where(Transaction.date >= start_date)
    if end_date:
        q = q.where(Transaction.date <= end_date)

    inc, exp = db.execute(q).one()
    inc = float(inc or 0.0)
    exp = float(exp or 0.0)
    return {"summary": {"income": round(inc, 2), "expense": round(exp, 2), "net": round(inc - exp, 2)}}


@router.get("/reports/by-category")
def report_by_category(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    type: str = Query("expense", pattern="^(income|expense)$"),
):
    stmt = (
        select(func.sum(Transaction.amount).label("total"), Transaction.category_id)
        .where(Transaction.user_id == current_user, func.lower(Transaction.type) == type)
        .group_by(Transaction.category_id)
    )
    if start_date:
        stmt = stmt.where(Transaction.date >= start_date)
    if end_date:
        stmt = stmt.where(Transaction.date <= end_date)

    if Category is not None:
        stmt = (
            select(func.sum(Transaction.amount).label("total"), Transaction.category_id, Category.name)
            .where(
                Transaction.user_id == current_user,
                func.lower(Transaction.type) == type,
                Transaction.category_id == Category.id,
            )
            .group_by(Transaction.category_id, Category.name)
        )
        if start_date:
            stmt = stmt.where(Transaction.date >= start_date)
        if end_date:
            stmt = stmt.where(Transaction.date <= end_date)
        rows = db.execute(stmt).all()
        data = [{"category_id": cid, "category_name": cname or "Uncategorized", "total": round(float(t or 0), 2)}
                for (t, cid, cname) in rows]
    else:
        rows = db.execute(stmt).all()
        data = [{"category_id": cid, "category_name": f"Category {cid}" if cid is not None else "Uncategorized",
                 "total": round(float(t or 0), 2)} for (t, cid) in rows]

    return {"type": type, "by_category": data}


@router.get("/reports/by-day")
def report_by_day(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
):
    """
    Daily rollup returning income, expense, net per day in range (defaults: last 30 days).
    """
    if not start_date or not end_date:
        end_d = _today()
        start_d = end_d - timedelta(days=29)
        start_date = _start_of_day(start_d)
        end_date = _end_of_day(end_d)

    day = func.strftime("%Y-%m-%d", Transaction.date).label("day")
    inc_sum = _income_sum_expr().label("income")
    exp_sum = _expense_sum_expr().label("expense")

    stmt = (
        select(day, inc_sum, exp_sum)
        .where(
            Transaction.user_id == current_user,
            Transaction.date >= start_date,
            Transaction.date <= end_date,
        )
        .group_by(day)
        .order_by(day)
    )
    rows = db.execute(stmt).all()

    out = []
    # Ensure contiguous output
    s = start_date.date()
    e = end_date.date()
    mp = {d: (float(i or 0), float(e2 or 0)) for d, i, e2 in rows}
    for d in _date_range(s, e):
        key = d.isoformat()
        inc, exp = mp.get(key, (0.0, 0.0))
        out.append({"date": key, "income": round(inc, 2), "expense": round(exp, 2), "net": round(inc - exp, 2)})

    return {"range": {"start": s.isoformat(), "end": e.isoformat()}, "by_day": out}


@router.get("/reports/cashflow")
def monthly_cashflow(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
    months: int = Query(6, ge=1, le=36),
):
    """
    Back-compat: same as series_monthly but with a different name.
    """
    return series_monthly(db=db, current_user=current_user, months=months)  # type: ignore
