from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone

from sqlmodel import Session, select
from sqlalchemy import func

from app.db.session import SessionLocal
from app.core.security import get_current_user
from app.models.transaction import Transaction  # SQLModel/ORM
from app.models.category import Category  # SQLModel/ORM

router = APIRouter()

# -------------------- DB session dep --------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------- Exec helpers (SQLModel/SQLAlchemy compat) --------------------
def _first(db: Session, stmt):
    if hasattr(db, "exec"):
        return db.exec(stmt).first()
    return db.execute(stmt).scalars().first()

def _all(db: Session, stmt):
    if hasattr(db, "exec"):
        return db.exec(stmt).all()
    return db.execute(stmt).scalars().all()

# -------------------- Date/time normalization --------------------
# SQLite DateTime wants Python datetime objects; prefer naive (UTC) if columns aren't timezone=True
_DT_FIELDS = {"date", "created_at", "updated_at"}

def _to_naive_utc(dt: datetime) -> datetime:
    # Convert tz-aware -> UTC naive; leave naive as-is
    if isinstance(dt, datetime):
        if dt.tzinfo is not None:
            return dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt
    return dt

def _parse_dt_str(s: str) -> Optional[datetime]:
    # Accept '...Z' and standard ISO, return naive UTC datetime
    if not isinstance(s, str):
        return None
    try:
        # handle trailing Z (Zulu)
        if s.endswith("Z"):
            # remove Z then parse with fromisoformat for simplicity
            s2 = s[:-1]
            # fromisoformat handles "YYYY-MM-DDTHH:MM:SS.mmm" or without millis
            dt = datetime.fromisoformat(s2)
            return _to_naive_utc(dt.replace(tzinfo=timezone.utc))
        # standard ISO string with or without offset
        dt = datetime.fromisoformat(s)
        # if the parsed dt has tzinfo, convert; else leave as naive
        return _to_naive_utc(dt)
    except Exception:
        return None

def _coerce_datetime_fields(data: Dict[str, Any]) -> None:
    """
    In-place: convert any known datetime fields coming as strings into Python datetime objects,
    normalized to naive UTC for SQLite compatibility.
    """
    for k in list(data.keys()):
        if k in _DT_FIELDS:
            v = data[k]
            if isinstance(v, str):
                parsed = _parse_dt_str(v)
                if parsed is not None:
                    data[k] = parsed
            elif isinstance(v, datetime):
                data[k] = _to_naive_utc(v)

# -------------------- Mutation safety --------------------
FORBIDDEN_MUTATION_FIELDS = {"id", "user_id", "created_at"}

def _apply_updates_safe(obj: Any, data: Dict[str, Any]) -> None:
    # Block immutable/sensitive fields
    for k in list(data.keys()):
        if k in FORBIDDEN_MUTATION_FIELDS:
            data.pop(k)
    # Normalize datetime fields (date, created_at, updated_at) if present
    _coerce_datetime_fields(data)
    # Apply only attributes that exist on the model
    for k, v in data.items():
        if hasattr(obj, k):
            setattr(obj, k, v)

def _stamp_created(obj: Any):
    # created_at server-side; naive UTC for SQLite
    if hasattr(obj, "created_at") and getattr(obj, "created_at", None) is None:
        obj.created_at = datetime.utcnow()

def _stamp_updated(obj: Any):
    # updated_at server-side; naive UTC for SQLite
    if hasattr(obj, "updated_at"):
        obj.updated_at = datetime.utcnow()

# -------------------- Routes --------------------

@router.post("/transactions", response_model=Transaction, status_code=status.HTTP_201_CREATED)
def create_transaction(
    body: Transaction,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    data = body.dict(exclude_unset=True)

    # Validate required fields
    if not data.get("category_id"):
        raise HTTPException(status_code=400, detail="Category ID is required.")
    if not data.get("merchant"):
        raise HTTPException(status_code=400, detail="Merchant is required.")

    # Validate that the category exists
    category = db.execute(select(Category).where(Category.id == data["category_id"])).scalars().first()
    if not category:
        raise HTTPException(status_code=400, detail="Invalid category ID.")

    # Ignore/override unsafe fields
    for k in FORBIDDEN_MUTATION_FIELDS:
        data.pop(k, None)

    # Ensure datetime fields are Python datetimes (naive UTC)
    _coerce_datetime_fields(data)

    # Log the incoming data for debugging
    print("Incoming transaction data:", data)

    obj = Transaction(**data)

    # Enforce ownership & timestamps server-side
    if hasattr(obj, "user_id"):
        obj.user_id = current_user
    _stamp_created(obj)
    _stamp_updated(obj)

    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/transactions", response_model=Dict[str, Any])
def list_transactions(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    txn_type: Optional[str] = Query(None, alias="type"),
    category_id: Optional[int] = None,
    page: int = 1,
    per_page: int = 15,  # Updated default per_page to 15
):
    # Guardrails for pagination
    page = max(1, page)
    per_page = max(1, min(per_page, 100))

    stmt = select(Transaction).where(Transaction.user_id == current_user)

    if start_date:
        stmt = stmt.where(Transaction.date >= _to_naive_utc(start_date))
    if end_date:
        stmt = stmt.where(Transaction.date <= _to_naive_utc(end_date))
    if txn_type:
        stmt = stmt.where(Transaction.type == txn_type)
    if category_id:
        stmt = stmt.where(Transaction.category_id == category_id)

    # Count total rows first
    count_stmt = select(func.count()).select_from(Transaction).where(stmt.whereclause)
    total_count = db.execute(count_stmt).scalar()

    # Deterministic ordering
    try:
        stmt = stmt.order_by(Transaction.date.desc(), Transaction.id.desc())
    except Exception:
        pass

    # Paginate results
    stmt = stmt.offset((page - 1) * per_page).limit(per_page)
    transactions = _all(db, stmt)

    return {
        "data": transactions,
        "pagination": {
            "total_count": total_count,
            "current_page": page,
            "per_page": per_page,
            "total_pages": (total_count + per_page - 1) // per_page,
        },
    }


@router.get("/transactions/{transaction_id}", response_model=Transaction)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    stmt = select(Transaction).where(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user,
    )
    row = _first(db, stmt)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return row


@router.put("/transactions/{transaction_id}", response_model=Transaction)
def update_transaction(
    transaction_id: int,
    body: Transaction,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    incoming = body.dict(exclude_unset=True)

    # Validate required fields
    if not incoming.get("category_id"):
        raise HTTPException(status_code=400, detail="Category ID is required.")
    if not incoming.get("merchant"):
        raise HTTPException(status_code=400, detail="Merchant is required.")

    # Fetch scoped to owner
    stmt = select(Transaction).where(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user,
    )
    row = _first(db, stmt)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    # Apply only allowed updates; prevent ownership/ID drift
    _apply_updates_safe(row, incoming)

    # Reassert ownership
    if hasattr(row, "user_id"):
        row.user_id = current_user

    _stamp_updated(row)

    # No db.add(row) needed; it's already tracked
    db.commit()
    db.refresh(row)
    return row


@router.delete("/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    stmt = select(Transaction).where(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user,
    )
    row = _first(db, stmt)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    db.delete(row)
    db.commit()
    return {"message": "Transaction deleted successfully"}
