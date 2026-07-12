"""Pydantic schemas for API requests and responses."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from uuid import UUID


class MessageResponse(BaseModel):
    """Generic message response."""
    message: str


class ErrorResponse(BaseModel):
    """Error response."""
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
    error_code: Optional[str] = None


# User schemas
class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    role: str = Field(default="resident", pattern="^(resident|caregiver|admin)$")


class UserCreate(UserBase):
    """User creation schema."""
    password: str = Field(..., min_length=8, max_length=128)


class UserUpdate(BaseModel):
    """User update schema."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    gender: Optional[str] = Field(None, max_length=20)
    nationality: Optional[str] = Field(None, max_length=100)
    age: Optional[int] = Field(None, ge=0, le=150)
    languages: Optional[List[str]] = None
    driving_license: Optional[bool] = None
    currently_working: Optional[bool] = None
    work_request: Optional[str] = Field(None, max_length=50)
    work_area: Optional[str] = Field(None, max_length=50)


class UserResponse(UserBase):
    """User response schema."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    role: str
    status: str
    gender: Optional[str] = None
    nationality: Optional[str] = None
    age: Optional[int] = None
    languages: List[str] = []
    driving_license: bool = False
    currently_working: bool = False
    work_request: Optional[str] = None
    work_area: Optional[str] = None
    onboarding_completed: bool = False
    onboarding_step: int = 0
    enabled_modules: List[str] = []
    disabled_modules: List[str] = []
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None
    email_verified_at: Optional[datetime] = None


class UserRoleUpdateRequest(BaseModel):
    """Request to update user role."""
    role: str = Field(..., pattern="^(resident|caregiver|admin)$")


class UserListResponse(BaseModel):
    """User list response with pagination."""
    items: List[UserResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PasswordChangeRequest(BaseModel):
    """Password change request."""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class TokenResponse(BaseModel):
    """Token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


# Job schemas
class JobBase(BaseModel):
    """Base job schema."""
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    job_type: str = Field(..., pattern="^(full_time|part_time|live_in|hourly|reliever)$")
    work_area: str = Field(default="All Area", pattern="^(Area 1|Area 2|Area 3|All Area)$")
    salary_min: Optional[int] = Field(None, ge=0)
    salary_max: Optional[int] = Field(None, ge=0)
    salary_currency: str = Field(default="ILS", max_length=3)
    city: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=255)
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class JobCreate(JobBase):
    """Job creation schema."""
    pass


class JobUpdate(BaseModel):
    """Job update schema."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    job_type: Optional[str] = Field(None, pattern="^(full_time|part_time|live_in|hourly|reliever)$")
    work_area: Optional[str] = Field(None, pattern="^(Area 1|Area 2|Area 3|All Area)$")
    salary_min: Optional[int] = Field(None, ge=0)
    salary_max: Optional[int] = Field(None, ge=0)
    salary_currency: Optional[str] = Field(None, max_length=3)
    city: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=255)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: Optional[bool] = None
    featured: Optional[bool] = None
    expires_at: Optional[datetime] = None


class JobResponse(JobBase):
    """Job response schema."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_id: UUID
    status: str
    is_active: bool
    featured: bool
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    owner: Optional[UserResponse] = None


class JobListResponse(BaseModel):
    """Job list response with pagination."""
    items: List[JobResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Module schemas
class ModuleConfigSchema(BaseModel):
    """Module configuration schema."""
    enabled: bool = False
    config: Dict[str, Any] = {}
    enabled_for_users: List[str] = []
    enabled_for_roles: List[str] = []
    disabled_for_users: List[str] = []


class ModuleResponse(BaseModel):
    """Module response schema."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    version: str
    description: str
    category: str
    author: str
    icon: str
    tags: List[str]
    admin_only: bool
    hidden: bool
    enabled: bool
    config: Dict[str, Any]
    config_schema: Dict[str, Any]
    dependencies: List[str]
    required_permissions: List[str]
    enabled_for_users: List[str]
    enabled_for_roles: List[str]
    disabled_for_users: List[str]
    status: str
    error_message: Optional[str] = None
    loaded_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ModuleInfoResponse(BaseModel):
    """Module info for admin panel."""
    name: str
    version: str
    description: str
    category: str
    author: str
    status: str
    enabled: bool
    config: Dict[str, Any]
    enabled_for_users: List[str]
    enabled_for_roles: List[str]
    disabled_for_users: List[str]
    dependencies: List[str]
    required_permissions: List[str]
    icon: str
    tags: List[str]
    admin_only: bool
    hidden: bool
    health: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class ModuleEnableRequest(BaseModel):
    """Request to enable module."""
    user_ids: Optional[List[str]] = None
    roles: Optional[List[str]] = None


class ModuleRoleEnableRequest(BaseModel):
    """Request to enable module for role."""
    role: str = Field(..., pattern="^(resident|caregiver|admin)$")


class ModuleConfigUpdateRequest(BaseModel):
    """Request to update module config."""
    config: Dict[str, Any]


# Pagination schemas
class PaginationParams(BaseModel):
    """Pagination parameters."""
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class PaginatedResponse(BaseModel):
    """Generic paginated response."""
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int


# Admin schemas
class AdminStatsResponse(BaseModel):
    """Admin dashboard statistics."""
    total_users: int
    caregivers: int
    residents: int
    admins: int
    total_jobs: int
    active_jobs: int
    inactive_jobs: int
    modules_loaded: int
    modules_enabled: int


class UserModuleConfigResponse(BaseModel):
    """User module configuration response."""
    user_id: UUID
    module_name: str
    enabled: bool
    config: Dict[str, Any]
    enabled_at: Optional[datetime] = None
    disabled_at: Optional[datetime] = None


class HealthCheckResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    timestamp: str
    database: str
    modules: Dict[str, Any]