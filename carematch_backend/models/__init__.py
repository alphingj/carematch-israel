"""Database models."""

import enum
from datetime import datetime, timezone
from typing import Optional, List
from uuid import uuid4

from sqlalchemy import (
    String,
    Text,
    DateTime,
    Boolean,
    Enum as SQLEnum,
    ForeignKey,
    Index,
    JSON,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class UserRole(str, enum.Enum):
    """User roles."""

    RESIDENT = "resident"
    CAREGIVER = "caregiver"
    ADMIN = "admin"


class UserStatus(str, enum.Enum):
    """User status."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    SUSPENDED = "suspended"


class User(Base):
    """User model."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole), default=UserRole.RESIDENT, nullable=False)
    status: Mapped[UserStatus] = mapped_column(SQLEnum(UserStatus), default=UserStatus.ACTIVE, nullable=False)

    # Profile
    gender: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    nationality: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    age: Mapped[Optional[int]] = mapped_column(nullable=True)
    languages: Mapped[List[str]] = mapped_column(JSON, default=list)
    driving_license: Mapped[bool] = mapped_column(Boolean, default=False)
    currently_working: Mapped[bool] = mapped_column(Boolean, default=False)
    work_request: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    work_area: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Onboarding
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    onboarding_step: Mapped[int] = mapped_column(default=0)

    # Module access
    enabled_modules: Mapped[List[str]] = mapped_column(JSON, default=list)
    disabled_modules: Mapped[List[str]] = mapped_column(JSON, default=list)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    email_verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    jobs: Mapped[List["Job"]] = relationship("Job", back_populates="owner", cascade="all, delete-orphan")
    module_configs: Mapped[List["UserModuleConfig"]] = relationship(
        "UserModuleConfig", back_populates="user", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_users_email_role", "email", "role"),
        Index("ix_users_status_role", "status", "role"),
    )


class JobType(str, enum.Enum):
    """Job types."""

    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    LIVE_IN = "live_in"
    HOURLY = "hourly"
    RELIEVER = "reliever"


class JobStatus(str, enum.Enum):
    """Job status."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    FILLED = "filled"
    EXPIRED = "expired"
    DRAFT = "draft"


class WorkArea(str, enum.Enum):
    """Work areas in Israel."""

    AREA_1 = "Area 1"
    AREA_2 = "Area 2"
    AREA_3 = "Area 3"
    ALL = "All Area"


class Job(Base):
    """Job posting model."""

    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    benefits: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Job details
    job_type: Mapped[JobType] = mapped_column(SQLEnum(JobType), nullable=False)
    work_area: Mapped[WorkArea] = mapped_column(SQLEnum(WorkArea), default=WorkArea.ALL, nullable=False)
    salary_min: Mapped[Optional[int]] = mapped_column(nullable=True)
    salary_max: Mapped[Optional[int]] = mapped_column(nullable=True)
    salary_currency: Mapped[str] = mapped_column(String(3), default="ILS")

    # Location
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(nullable=True)

    # Status
    status: Mapped[JobStatus] = mapped_column(SQLEnum(JobStatus), default=JobStatus.DRAFT, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Owner
    owner_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="jobs")

    __table_args__ = (
        Index("ix_jobs_status_active", "status", "is_active"),
        Index("ix_jobs_owner_status", "owner_id", "status"),
        Index("ix_jobs_area_type", "work_area", "job_type"),
    )


class ModuleCategory(str, enum.Enum):
    """Module categories."""

    CORE = "core"
    JOBS = "jobs"
    USERS = "users"
    ADMIN = "admin"
    NOTIFICATIONS = "notifications"
    REPORTING = "reporting"
    INTEGRATIONS = "integrations"
    CAREGIVER_TOOLS = "caregiver_tools"
    RESIDENT_TOOLS = "resident_tools"
    CUSTOM = "custom"


class Module(Base):
    """Module registry model."""

    __tablename__ = "modules"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[ModuleCategory] = mapped_column(SQLEnum(ModuleCategory), default=ModuleCategory.CUSTOM)
    author: Mapped[str] = mapped_column(String(255), default="Carematch Team")
    icon: Mapped[str] = mapped_column(String(50), default="puzzle")
    tags: Mapped[List[str]] = mapped_column(JSON, default=list)
    admin_only: Mapped[bool] = mapped_column(Boolean, default=False)
    hidden: Mapped[bool] = mapped_column(Boolean, default=False)

    # Configuration
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    config_schema: Mapped[dict] = mapped_column(JSON, default=dict)

    # Access control
    enabled_for_users: Mapped[List[str]] = mapped_column(JSON, default=list)
    enabled_for_roles: Mapped[List[str]] = mapped_column(JSON, default=list)
    disabled_for_users: Mapped[List[str]] = mapped_column(JSON, default=list)
    required_permissions: Mapped[List[str]] = mapped_column(JSON, default=list)

    # Dependencies
    dependencies: Mapped[List[str]] = mapped_column(JSON, default=list)

    # Status
    status: Mapped[str] = mapped_column(String(50), default="discovered")
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    loaded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user_configs: Mapped[List["UserModuleConfig"]] = relationship(
        "UserModuleConfig", back_populates="module", cascade="all, delete-orphan"
    )


class UserModuleConfig(Base):
    """Per-user module configuration."""

    __tablename__ = "user_module_configs"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    module_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)

    # Configuration
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    config: Mapped[dict] = mapped_column(JSON, default=dict)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="module_configs")
    module: Mapped["Module"] = relationship("Module", back_populates="user_configs")

    __table_args__ = (
        UniqueConstraint("user_id", "module_id", name="uq_user_module_config"),
        Index("ix_user_module_configs_user", "user_id"),
        Index("ix_user_module_configs_module", "module_id"),
    )


class AuditLog(Base):
    """Audit log for important actions."""

    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    old_values: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    new_values: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    __table_args__ = (
        Index("ix_audit_logs_user_action", "user_id", "action"),
        Index("ix_audit_logs_resource", "resource_type", "resource_id"),
        Index("ix_audit_logs_created_at", "created_at"),
    )