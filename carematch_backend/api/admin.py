"""Admin API endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from datetime import datetime, timedelta

from core.database import get_db
from core.exceptions import NotFoundError
from models import User, Job, Module, AuditLog
from schemas import AdminStatsResponse, MessageResponse
from api.deps import require_admin_dep, PaginationParams

# Include claims router
from admin.claims import router as claims_router

router = APIRouter(prefix="/admin", tags=["admin"])
router.include_router(claims_router)


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> AdminStatsResponse:
    """Get admin dashboard statistics."""
    # Users
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar() or 0

    caregivers_result = await db.execute(
        select(func.count(User.id)).where(User.role == "caregiver")
    )
    caregivers = caregivers_result.scalar() or 0

    residents_result = await db.execute(
        select(func.count(User.id)).where(User.role == "resident")
    )
    residents = residents_result.scalar() or 0

    admins_result = await db.execute(
        select(func.count(User.id)).where(User.role == "admin")
    )
    admins = admins_result.scalar() or 0

    # Jobs
    total_jobs_result = await db.execute(select(func.count(Job.id)))
    total_jobs = total_jobs_result.scalar() or 0

    active_jobs_result = await db.execute(
        select(func.count(Job.id)).where(Job.is_active == True)
    )
    active_jobs = active_jobs_result.scalar() or 0

    inactive_jobs = total_jobs - active_jobs

    # Modules
    from modules.loader import module_registry
    modules = module_registry.get_all_modules()
    modules_total = len(modules)
    modules_enabled = sum(1 for m in modules if m.config.enabled)
    modules_error = sum(1 for m in modules if m.state.status.value == "error")

    return AdminStatsResponse(
        total_users=total_users,
        caregivers=caregivers,
        residents=residents,
        admins=admins,
        total_jobs=total_jobs,
        active_jobs=active_jobs,
        inactive_jobs=inactive_jobs,
        modules_total=modules_total,
        modules_enabled=modules_enabled,
        modules_error=modules_error,
    )


@router.get("/users/recent", response_model=List[dict])
async def get_recent_users(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> List[dict]:
    """Get recently registered users."""
    result = await db.execute(
        select(User).order_by(User.created_at.desc()).limit(limit)
    )
    users = result.scalars().all()

    return [
        {
            "id": str(u.id),
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "status": u.status,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.get("/jobs/recent", response_model=List[dict])
async def get_recent_jobs(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> List[dict]:
    """Get recently posted jobs."""
    result = await db.execute(
        select(Job).order_by(Job.created_at.desc()).limit(limit)
    )
    jobs = result.scalars().all()

    return [
        {
            "id": str(j.id),
            "title": j.title,
            "owner_id": str(j.owner_id),
            "status": j.status,
            "is_active": j.is_active,
            "created_at": j.created_at.isoformat() if j.created_at else None,
        }
        for j in jobs
    ]


@router.get("/audit-logs", response_model=List[dict])
async def get_audit_logs(
    pagination: PaginationParams = Depends(),
    action: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> List[dict]:
    """Get audit logs with filters."""
    query = select(AuditLog)

    if action:
        query = query.where(AuditLog.action == action)
    if user_id:
        query = query.where(AuditLog.user_id == user_id)
    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type)
    if start_date:
        query = query.where(AuditLog.created_at >= start_date)
    if end_date:
        query = query.where(AuditLog.created_at <= end_date)

    query = query.order_by(AuditLog.created_at.desc())
    query = query.offset(pagination.offset).limit(pagination.limit)

    result = await db.execute(query)
    logs = result.scalars().all()

    return [
        {
            "id": str(log.id),
            "user_id": str(log.user_id) if log.user_id else None,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]


@router.get("/system/info", response_model=dict)
async def get_system_info(
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get system information."""
    from core.config import settings
    import sys
    import platform

    # Database info
    db_version = "unknown"
    try:
        result = await db.execute(text("SELECT version()"))
        db_version = result.scalar() or "unknown"
    except Exception:
        pass

    return {
        "app_name": settings.APP_NAME,
        "app_version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "python_version": sys.version,
        "platform": platform.platform(),
        "database_version": db_version,
        "modules_loaded": len(module_registry.get_all_modules()),
        "uptime_seconds": 0,  # Would need process start time tracking
    }


@router.post("/system/maintenance", response_model=MessageResponse)
async def toggle_maintenance_mode(
    enabled: bool,
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Toggle maintenance mode."""
    # This would typically update a system config
    return MessageResponse(
        message=f"Maintenance mode {'enabled' if enabled else 'disabled'}"
    )


@router.get("/config", response_model=dict)
async def get_system_config(
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get system configuration (non-sensitive)."""
    from core.config import settings

    return {
        "app_name": settings.APP_NAME,
        "app_version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "cors_origins": settings.CORS_ORIGINS,
        "module_auto_discover": settings.MODULE_AUTO_DISCOVER,
        "module_hot_reload": settings.MODULE_HOT_RELOAD,
        "prometheus_enabled": settings.PROMETHEUS_ENABLED,
        "log_level": settings.LOG_LEVEL,
    }