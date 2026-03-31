"""
auth.py - JWT token creation/verification and password hashing
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db, User
import os

# ── Config ─────────────────────────────────────────────────────────────────────
SECRET_KEY  = os.getenv("SECRET_KEY", "your-super-secret-jwt-key-change-in-production")
ALGORITHM   = "HS256"
TOKEN_EXPIRE_HOURS = 24 * 7   # 7 days

# ── Instances ──────────────────────────────────────────────────────────────────
pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


# ── Password Utils ─────────────────────────────────────────────────────────────
def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── Token Utils ────────────────────────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=TOKEN_EXPIRE_HOURS))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── Dependency: current user ───────────────────────────────────────────────────
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(token)
    user_id: int = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token missing subject")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ── SaaS: usage limiter ────────────────────────────────────────────────────────
DAILY_LIMITS = {"free": 15, "pro": 500}
FREE_PLAN_LIMIT = 15


def check_and_increment_usage(user: User, db: Session) -> None:
    """Enforce daily request limits. Resets at midnight UTC."""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    limit = DAILY_LIMITS.get(user.plan, FREE_PLAN_LIMIT)

    # Reset counter on new day
    if user.usage_date != today:
        user.usage_count = 0
        user.usage_date  = today

    if user.usage_count >= limit:
        raise HTTPException(
            status_code=429,
            detail=f"Daily limit of {limit} requests reached for {user.plan} plan. Upgrade to Pro for more.",
        )

    user.usage_count += 1
    db.commit()
