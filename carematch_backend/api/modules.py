"""Modules API endpoints."""

from typing import List
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import ModuleNotFoundError, ValidationError
from models import User, Module, UserModuleConfig
from schemas import (
    ModuleResponse,
    ModuleInfoResponse,
    ModuleEnableRequest,
    ModuleRoleEnableRequest,
    ModuleConfigUpdateRequest,
    MessageResponse,
)
from api.deps import require_admin_dep, get_current_user_dep
from modules.loader import module_registry

router = APIRouter(prefix="/modules", tags=["modules"])


@router.get("", response_model=List[ModuleInfoResponse])
async def list_modules(
    category: str = Query(None),
    include_hidden: bool = Query(False),
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> List[ModuleInfoResponse]:
    """List all modules with their status and configuration."""
    modules = module_registry.get_all_modules()
    
    result = []
    for module in modules:
        if module.metadata.hidden and not include_hidden:
            continue
        if category and module.metadata.category.value != category:
            continue
        
        # Get health check
        health = None
        try:
            health = await module.health_check()
        except Exception:
            health = {"status": "unhealthy"}
        
        info = ModuleInfoResponse(
            name=module.metadata.name,
            version=module.metadata.version,
            description=module.metadata.description,
            category=module.metadata.category.value,
            author=module.metadata.author,
            status=module.state.status.value,
            enabled=module.config.enabled,
            config=module.config.config,
            enabled_for_users=module.config.enabled_for_users,
            enabled_for_roles=module.config.enabled_for_roles,
            disabled_for_users=module.config.disabled_for_users,
            dependencies=module.metadata.dependencies,
            required_permissions=module.metadata.required_permissions,
            icon=module.metadata.icon,
            tags=module.metadata.tags,
            admin_only=module.metadata.admin_only,
            hidden=module.metadata.hidden,
            health=health,
            error=module.state.error,
        )
        result.append(info)
    
    return result


@router.get("/{module_name}", response_model=ModuleInfoResponse)
async def get_module(
    module_name: str,
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> ModuleInfoResponse:
    """Get detailed module information."""
    module = module_registry.get_module(module_name)
    if not module:
        raise ModuleNotFoundError(module_name)
    
    health = None
    try:
        health = await module.health_check()
    except Exception:
        health = {"status": "unhealthy"}
    
    return ModuleInfoResponse(
        name=module.metadata.name,
        version=module.metadata.version,
        description=module.metadata.description,
        category=module.metadata.category.value,
        author=module.metadata.author,
        status=module.state.status.value,
        enabled=module.config.enabled,
        config=module.config.config,
        enabled_for_users=module.config.enabled_for_users,
        enabled_for_roles=module.config.enabled_for_roles,
        disabled_for_users=module.config.disabled_for_users,
        dependencies=module.metadata.dependencies,
        required_permissions=module.metadata.required_permissions,
        icon=module.metadata.icon,
        tags=module.metadata.tags,
        admin_only=module.metadata.admin_only,
        hidden=module.metadata.hidden,
        health=health,
        error=module.state.error,
    )


@router.post("/{module_name}/enable", response_model=MessageResponse)
async def enable_module(
    module_name: str,
    request: ModuleEnableRequest,
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Enable module globally."""
    success = await module_registry.enable_module(module_name)
    if not success:
        raise ModuleNotFoundError(module_name)
    return MessageResponse(message=f"Module {module_name} enabled globally")


@router.post("/{module_name}/disable", response_model=MessageResponse)
async def disable_module(
    module_name: str,
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Disable module globally."""
    success = await module_registry.disable_module(module_name)
    if not success:
        raise ModuleNotFoundError(module_name)
    return MessageResponse(message=f"Module {module_name} disabled globally")


@router.post("/{module_name}/enable/user", response_model=MessageResponse)
async def enable_module_for_user(
    module_name: str,
    request: ModuleEnableRequest,
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Enable module for specific user."""
    success = await module_registry.enable_module_for_user(module_name, request.user_id)
    if not success:
        raise ModuleNotFoundError(module_name)
    return MessageResponse(message=f"Module {module_name} enabled for user")


@router.post("/{module_name}/disable/user", response_model=MessageResponse)
async def disable_module_for_user(
    module_name: str,
    request: ModuleEnableRequest,
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Disable module for specific user."""
    success = await module_registry.disable_module_for_user(module_name, request.user_id)
    if not success:
        raise ModuleNotFoundError(module_name)
    return MessageResponse(message=f"Module {module_name} disabled for user")


@router.post("/{module_name}/enable/role", response_model=MessageResponse)
async def enable_module_for_role(
    module_name: str,
    request: ModuleRoleEnableRequest,
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Enable module for all users with specific role."""
    success = await module_registry.enable_module_for_role(module_name, request.role)
    if not success:
        raise ModuleNotFoundError(module_name)
    return MessageResponse(message=f"Module {module_name} enabled for role {request.role}")


@router.post("/{module_name}/disable/role", response_model=MessageResponse)
async def disable_module_for_role(
    module_name: str,
    request: ModuleRoleEnableRequest,
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Disable module for all users with specific role."""
    success = await module_registry.disable_module_for_role(module_name, request.role)
    if not success:
        raise ModuleNotFoundError(module_name)
    return MessageResponse(message=f"Module {module_name} disabled for role {request.role}")


@router.patch("/{module_name}/config", response_model=MessageResponse)
async def update_module_config(
    module_name: str,
    request: ModuleConfigUpdateRequest,
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Update module configuration."""
    success = await module_registry.update_module_config(module_name, request.config)
    if not success:
        raise ModuleNotFoundError(module_name)
    return MessageResponse(message=f"Module {module_name} configuration updated")


@router.post("/{module_name}/reload", response_model=MessageResponse)
async def reload_module(
    module_name: str,
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Reload module (hot reload)."""
    from modules.loader import module_loader
    from main import app
    
    success = await module_registry.reload_module(module_name, app, db)
    if not success:
        raise ModuleNotFoundError(module_name)
    return MessageResponse(message=f"Module {module_name} reloaded")


@router.get("/health/all")
async def all_modules_health(
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get health status of all modules."""
    return await module_registry.health_check_all()


@router.get("/categories/list")
async def list_categories(
    current_user: User = Depends(require_admin_dep),
) -> List[str]:
    """List all module categories."""
    from modules.base import ModuleCategory
    return [cat.value for cat in ModuleCategory]


@router.get("/discovered/list")
async def list_discovered_modules(
    current_user: User = Depends(require_admin_dep),
) -> List[dict]:
    """List all discovered modules (loaded or not)."""
    discovered = module_registry.loader.get_discovered_modules()
    return [
        {
            "name": name,
            "metadata": cls().metadata.model_dump() if hasattr(cls, 'metadata') else {},
        }
        for name, cls in discovered.items()
    ]