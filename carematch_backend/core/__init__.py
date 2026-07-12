"""Core package initialization."""

from core.config import Settings, get_settings
from core.database import Base, get_db, get_db_context, init_db, close_db
from core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    create_token_pair,
)
from core.exceptions import (
    AppException,
    NotFoundError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    BadRequestError,
    ModuleError,
    ModuleNotFoundError,
    ModuleAlreadyEnabledError,
    ModuleNotEnabledError,
    DatabaseError,
    ExternalServiceError,
    RateLimitError,
)

__all__ = [
    "Settings",
    "get_settings",
    "Base",
    "get_db",
    "get_db_context",
    "init_db",
    "close_db",
    "hash_password",
    "verify_password",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "create_token_pair",
    "AppException",
    "NotFoundError",
    "ValidationError",
    "AuthenticationError",
    "AuthorizationError",
    "ConflictError",
    "BadRequestError",
    "ModuleError",
    "ModuleNotFoundError",
    "ModuleAlreadyEnabledError",
    "ModuleNotEnabledError",
    "DatabaseError",
    "ExternalServiceError",
    "RateLimitError",
]