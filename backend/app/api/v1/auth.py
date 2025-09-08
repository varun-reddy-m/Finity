from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from app.core.security import hash_password, verify_password, create_access_token, get_current_user, decode_access_token
from datetime import timedelta
from app.models.user import user as UserModel
from app.db.session import SessionLocal
from sqlmodel import Session
from typing import Optional
import logging

router = APIRouter()
logger = logging.getLogger(__name__)  # Get the logger for this module

class User(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class RefreshToken(BaseModel):
    refresh_token: str

@router.post("/register", response_model=Token)
def register(user: User):
    db: Session = SessionLocal()
    existing_user = db.query(UserModel).filter(UserModel.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    hashed_password = hash_password(user.password)
    new_user = UserModel(email=user.email, password_hash=hashed_password, full_name=user.full_name)  # Use correct field name
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    access_token = create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(user: User):
    try:
        # Use context manager for database session
        with SessionLocal() as db:
            db_user = db.query(UserModel).filter(UserModel.email == user.email).first()
            if not db_user or not verify_password(user.password, db_user.password_hash):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials",
                )
            access_token = create_access_token(data={"sub": db_user.email})
            return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        # Re-raise HTTP exceptions without modification
        raise
    except Exception as e:
        # Log the error for debugging
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login. Please try again later."
        )

@router.post("/refresh", response_model=Token)
def refresh_token(refresh: RefreshToken):
    # For simplicity, re-issue access token using refresh token
    # In production, validate refresh token properly
    email = decode_access_token(refresh.refresh_token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    access_token = create_access_token(data={"sub": email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def get_me(current_user: str = Depends(get_current_user)):
    return {"email": current_user}

@router.post("/logout")
def logout(request: Request):
    token = request.headers.get("Authorization")
    if token:
        token = token.replace("Bearer ", "")
        email = decode_access_token(token)
        if email and email in refresh_tokens_db:
            del refresh_tokens_db[email]
    return {"message": "Logged out successfully"}
