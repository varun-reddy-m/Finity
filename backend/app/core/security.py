from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from app.db.session import SessionLocal
from app.models.user import User
from sqlmodel import select

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "Qr642rfsdhrhsbdheytujynmtuyf9th1gnr88dyjhnkfutcyfghnfktydfg567igcfghjnyui9u"  
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 90

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None

def get_current_user(token: str = Depends(oauth2_scheme)):
    email = decode_access_token(token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    # Fetch the user's ID using their email
    db = SessionLocal()
    user = db.execute(select(User).where(User.email == email)).scalars().first()
    db.close()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user.id  # Return the user's numeric ID
