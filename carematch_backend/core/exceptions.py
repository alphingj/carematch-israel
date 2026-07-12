"""Custom exceptions for the application."""

from typing import Any, Dict, Optional


class AppException(Exception):
    """Base application exception."""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        super().__init__(message)


class NotFoundError(AppException):
    """Resource not found."""

    def __init__(self, resource: str, identifier: Any, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"{resource} not found",
            status_code=404,
            error_code="NOT_FOUND",
            details={"resource": resource, "identifier": str(identifier), **(details or {})},
        )


class ValidationError(AppException):
    """Validation error."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=422,
            error_code="VALIDATION_ERROR",
            details=details,
        )


class AuthenticationError(AppException):
    """Authentication failed."""

    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=401,
            error_code="AUTHENTICATION_ERROR",
            details=details,
        )


class AuthorizationError(AppException):
    """Authorization failed - insufficient permissions."""

    def __init__(self, message: str = "Insufficient permissions", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=403,
            error_code="AUTHORIZATION_ERROR",
            details=details,
        )


class ConflictError(AppException):
    """Resource conflict."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=409,
            error_code="CONFLICT_ERROR",
            details=details,
        )


class BadRequestError(AppException):
    """Bad request."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=400,
            error_code="BAD_REQUEST",
            details=details,
        )


class ModuleError(AppException):
    """Module-related error."""

    def __init__(self, message: str, module_name: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=500,
            error_code="MODULE_ERROR",
            details={"module": module_name, **(details or {})},
        )


class ModuleNotFoundError(AppException):
    """Module not found."""

    def __init__(self, module_name: str):
        super().__init__(
            message=f"Module '{module_name}' not found",
            status_code=404,
            error_code="MODULE_NOT_FOUND",
            details={"module": module_name},
        )


class ModuleAlreadyEnabledError(AppException):
    """Module already enabled for user."""

    def __init__(self, module_name: str, user_id: str):
        super().__init__(
            message=f"Module '{module_name}' is already enabled for user",
            status_code=409,
            error_code="MODULE_ALREADY_ENABLED",
            details={"module": module_name, "user_id": user_id},
        )


class ModuleNotEnabledError(AppException):
    """Module not enabled for user."""

    def __init__(self, module_name: str, user_id: str):
        super().__init__(
            message=f"Module '{module_name}' is not enabled for user",
            status_code=403,
            error_code="MODULE_NOT_ENABLED",
            details={"module": module_name, "user_id": user_id},
        )


class DatabaseError(AppException):
    """Database operation error."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=500,
            error_code="DATABASE_ERROR",
            details=details,
        )


class ExternalServiceError(AppException):
    """External service error."""

    def __init__(self, service: str, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"{service}: {message}",
            status_code=502,
            error_code="EXTERNAL_SERVICE_ERROR",
            details={"service": service, **(details or {})},
        )


class RateLimitError(AppException):
    """Rate limit exceeded."""

    def __init__(self, message: str = "Rate limit exceeded", retry_after: int = 60):
        super().__init__(
            message=message,
            status_code=429,
            error_code="RATE_LIMIT_EXCEEDED",
            details={"retry_after": retry_after},
        )