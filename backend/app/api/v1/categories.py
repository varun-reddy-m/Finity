from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone

from sqlmodel import Session, select

from app.db.session import SessionLocal
from app.core.security import get_current_user
from app.models.category import Category  # SQLModel ORM
from app.models.user import User  # Import User model

router = APIRouter()

# ---------- DB session dependency ----------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------- Helpers ----------
FORBIDDEN_MUTATION_FIELDS = {"id", "user_id", "created_at"}

def _apply_updates_safe(obj: Any, data: Dict[str, Any]) -> None:
    """
    Apply updates onto an ORM object while blocking immutable/sensitive fields.
    Also normalizes a few common types.
    """
    # Remove immutable/sensitive fields if present
    for k in list(data.keys()):
        if k in FORBIDDEN_MUTATION_FIELDS:
            data.pop(k)

    # Normalize any datetime strings if you ever decide to allow such fields later
    for k, v in list(data.items()):
        if isinstance(v, str) and k.endswith("_at"):
            # Only parse if the attribute already exists and is expected to be a datetime
            if hasattr(obj, k) and isinstance(getattr(obj, k), (datetime, type(None))):
                try:
                    data[k] = datetime.fromisoformat(v)
                except ValueError:
                    # Let FastAPI validation handle it or ignore parsing here
                    pass

    # Apply onto the tracked instance
    for k, v in data.items():
        if hasattr(obj, k):
            setattr(obj, k, v)

# ---------- Routes ----------

@router.get("/categories", response_model=List[Category])
def list_categories(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """
    List categories owned by the current user.
    """
    stmt = select(Category).where(Category.user_id == current_user)
    rows = db.exec(stmt).all() if hasattr(db, "exec") else db.execute(stmt).scalars().all()
    return rows


@router.get("/categories/{category_id}", response_model=Category)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """
    Get a single category owned by the current user.
    """
    stmt = select(Category).where(
        Category.id == category_id,
        Category.user_id == current_user,
    )
    row = db.exec(stmt).first() if hasattr(db, "exec") else db.execute(stmt).scalars().first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return row


@router.post("/categories", response_model=Category, status_code=status.HTTP_201_CREATED)
def create_category(
    body: Category,  # using your existing model as input
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """
    Create a category for the current user. Ignores client-supplied id/user_id/created_at.
    """
    data = body.dict(exclude_unset=True)

    # Block mass-assignment of immutable/sensitive fields
    for k in FORBIDDEN_MUTATION_FIELDS:
        data.pop(k, None)

    obj = Category(**data)

    # Enforce ownership and timestamps server-side
    if hasattr(obj, "user_id"):
        # Fetch the user's ID using their email
        user = db.execute(select(User).where(User.email == current_user)).scalars().first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        obj.user_id = user.id  # Assign the numeric user ID
    if hasattr(obj, "created_at") and getattr(obj, "created_at", None) is None:
        obj.created_at = datetime.now(timezone.utc)
    if hasattr(obj, "updated_at"):
        obj.updated_at = datetime.now(timezone.utc)

    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/categories/{category_id}", response_model=Category)
def update_category(
    category_id: int,
    body: Category,  # using your existing model as input
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """
    Update a category owned by the current user.
    Prevents changes to id/user_id/created_at and reasserts ownership.
    Fixes the 'record disappears after PUT' issue by never letting user_id drift.
    """
    # Fetch scoped to owner
    stmt = select(Category).where(
        Category.id == category_id,
        Category.user_id == current_user,
    )
    existing = db.exec(stmt).first() if hasattr(db, "exec") else db.execute(stmt).scalars().first()
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    # Apply only allowed updates (PUT here keeps partial behavior like your original code;
    # switch to a separate CategoryUpdate schema if you prefer PATCH semantics clearly)
    incoming = body.dict(exclude_unset=True)
    _apply_updates_safe(existing, incoming)

    # Reassert ownership — addresses the exact bug you saw
    if hasattr(existing, "user_id"):
        existing.user_id = current_user

    # Server-controlled update timestamp
    if hasattr(existing, "updated_at"):
        existing.updated_at = datetime.now(timezone.utc)

    # No db.add(existing) — it's already tracked
    db.commit()
    db.refresh(existing)
    return existing


@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """
    Delete a category owned by the current user.
    """
    stmt = select(Category).where(
        Category.id == category_id,
        Category.user_id == current_user,
    )
    existing = db.exec(stmt).first() if hasattr(db, "exec") else db.execute(stmt).scalars().first()
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    db.delete(existing)
    db.commit()
    # You could also `return Response(status_code=204)` if you prefer
    return {"message": "Category deleted successfully"}
