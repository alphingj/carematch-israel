"""Security utilities: password hashing, JWT tokens, authentication."""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from uuid import uuid4

from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel

from core.config import settings


# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=settings.BCRYPT_ROUNDS)


def hash_password(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


# Token models
class TokenPayload(BaseModel):
    """JWT token payload."""

    sub: str
    email: str
    role: str
    modules: List[str] = []
    exp: int
    iat: int
    jti: str
    type: str = "access"


class Token(BaseModel):
    """Token response model."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


def create_access_token(
    subject: str,
    email: str,
    role: str,
    modules: Optional[List[str]] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create JWT access token."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = TokenPayload(
        sub=subject,
        email=email,
        role=role,
        modules=modules or [],
        exp=int(expire.timestamp()),
        iat=int(now.timestamp()),
        jti=str(uuid4()),
        type="access",
    )
    return jwt.encode(payload.model_dump(), settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT refresh token."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": subject,
        "exp": int(expire.timestamp()),
        "iat": int(now.timestamp()),
        "jti": str(uuid4()),
        "type": "refresh",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[TokenPayload]:
    """Decode and validate JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "access":
            return None
        return TokenPayload(**payload)
    except JWTError:
        return None


def decode_refresh_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate refresh token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None


def create_token_pair(
    user_id: str,
    email: str,
    role: str,
    modules: Optional[List[str]] = None,
) -> Token:
    """Create access and refresh token pair."""
    access_token = create_access_token(user_id, email, role, modules)
    refresh_token = create_refresh_token(user_id)
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )