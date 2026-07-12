"""Jobs API endpoints."""

from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload

from core.database import get_db
from core.exceptions import NotFoundError, ValidationError
from api.deps import get_current_active_user_dep, require_admin_dep, PaginationParams
from models import Job, User, JobStatus, JobType, WorkArea
from schemas import JobResponse, JobCreate, JobUpdate, JobListResponse, MessageResponse

router = APIRouter()


@router.get("", response_model=JobListResponse)
async def list_jobs(
    pagination: PaginationParams = Depends(),
    search: Optional[str] = Query(None),
    area: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    owner_id: Optional[UUID] = Query(None),
    current_user: User = Depends(get_current_active_user_dep),
    db: AsyncSession = Depends(get_db),
) -> JobListResponse:
    """List jobs with filters."""
    query = select(Job).options(selectinload(Job.owner))

    # Apply filters
    if search:
        query = query.where(
            or_(
                Job.title.ilike(f"%{search}%"),
                Job.description.ilike(f"%{search}%"),
                Job.city.ilike(f"%{search}%"),
            )
        )

    if area:
        query = query.where(Job.work_area == area)

    if job_type:
        query = query.where(Job.job_type == job_type)

    if status:
        query = query.where(Job.status == status)

    if is_active is not None:
        query = query.where(Job.is_active == is_active)

    if owner_id:
        query = query.where(Job.owner_id == owner_id)
    elif current_user.role != "admin":
        # Non-admins only see their own jobs or active public jobs
        query = query.where(
            or_(
                Job.owner_id == current_user.id,
                and_(Job.is_active == True, Job.status == JobStatus.ACTIVE),
            )
        )

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Apply pagination and ordering
    query = query.offset(pagination.offset).limit(pagination.limit).order_by(Job.created_at.desc())
    result = await db.execute(query)
    jobs = result.scalars().all()

    # Build response with owner names
    job_responses = []
    for job in jobs:
        job_dict = JobResponse.model_validate(job).model_dump()
        job_dict["owner_name"] = job.owner.name if job.owner else None
        job_responses.append(JobResponse(**job_dict))

    return JobListResponse(
        items=job_responses,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=(total + pagination.page_size - 1) // pagination.page_size,
    )


@router.get("/stats", response_model=dict)
async def get_job_stats(
    current_user: User = Depends(get_current_active_user_dep),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get job statistics."""
    # Total jobs
    total_result = await db.execute(select(func.count(Job.id)))
    total = total_result.scalar() or 0

    # By status
    status_result = await db.execute(
        select(Job.status, func.count(Job.id)).group_by(Job.status)
    )
    by_status = {str(row[0]): row[1] for row in status_result.all()}

    # By type
    type_result = await db.execute(
        select(Job.job_type, func.count(Job.id)).group_by(Job.job_type)
    )
    by_type = {str(row[0]): row[1] for row in type_result.all()}

    # By area
    area_result = await db.execute(
        select(Job.work_area, func.count(Job.id)).group_by(Job.work_area)
    )
    by_area = {str(row[0]): row[1] for row in area_result.all()}

    # Active/inactive
    active_result = await db.execute(
        select(func.count(Job.id)).where(Job.is_active == True)
    )
    active = active_result.scalar() or 0

    return {
        "total": total,
        "active": active,
        "inactive": total - active,
        "by_status": by_status,
        "by_type": by_type,
        "by_area": by_area,
    }


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: UUID,
    current_user: User = Depends(get_current_active_user_dep),
    db: AsyncSession = Depends(get_db),
) -> JobResponse:
    """Get job by ID."""
    result = await db.execute(
        select(Job).options(selectinload(Job.owner)).where(Job.id == job_id)
    )
    job = result.scalar_one_or_none()

    if not job:
        raise NotFoundError("Job", str(job_id))

    # Check access
    if current_user.role != "admin" and job.owner_id != current_user.id:
        if not job.is_active or job.status != JobStatus.ACTIVE:
            raise NotFoundError("Job", str(job_id))

    response = JobResponse.model_validate(job)
    response.owner_name = job.owner.name if job.owner else None
    return response


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_data: JobCreate,
    current_user: User = Depends(get_current_active_user_dep),
    db: AsyncSession = Depends(get_db),
) -> JobResponse:
    """Create new job posting."""
    job = Job(
        **job_data.model_dump(),
        owner_id=current_user.id,
        status=JobStatus.DRAFT,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    response = JobResponse.model_validate(job)
    response.owner_name = current_user.name
    return response


@router.patch("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: UUID,
    job_data: JobUpdate,
    current_user: User = Depends(get_current_active_user_dep),
    db: AsyncSession = Depends(get_db),
) -> JobResponse:
    """Update job posting."""
    result = await db.execute(
        select(Job).options(selectinload(Job.owner)).where(Job.id == job_id)
    )
    job = result.scalar_one_or_none()

    if not job:
        raise NotFoundError("Job", str(job_id))

    # Check ownership
    if current_user.role != "admin" and job.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    # Update fields
    update_data = job_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)

    # Auto-publish if status changes to active
    if "status" in update_data and update_data["status"] == JobStatus.ACTIVE and not job.published_at:
        job.published_at = datetime.utcnow()

    await db.commit()
    await db.refresh(job)

    response = JobResponse.model_validate(job)
    response.owner_name = job.owner.name if job.owner else None
    return response


@router.patch("/{job_id}/publish", response_model=JobResponse)
async def publish_job(
    job_id: UUID,
    current_user: User = Depends(get_current_active_user_dep),
    db: AsyncSession = Depends(get_db),
) -> JobResponse:
    """Publish job (set status to active)."""
    result = await db.execute(
        select(Job).options(selectinload(Job.owner)).where(Job.id == job_id)
    )
    job = result.scalar_one_or_none()

    if not job:
        raise NotFoundError("Job", str(job_id))

    if current_user.role != "admin" and job.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    job.status = JobStatus.ACTIVE
    job.is_active = True
    job.published_at = datetime.utcnow()

    await db.commit()
    await db.refresh(job)

    response = JobResponse.model_validate(job)
    response.owner_name = job.owner.name if job.owner else None
    return response


@router.patch("/{job_id}/unpublish", response_model=JobResponse)
async def unpublish_job(
    job_id: UUID,
    current_user: User = Depends(get_current_active_user_dep),
    db: AsyncSession = Depends(get_db),
) -> JobResponse:
    """Unpublish job (set status to inactive)."""
    result = await db.execute(
        select(Job).options(selectinload(Job.owner)).where(Job.id == job_id)
    )
    job = result.scalar_one_or_none()

    if not job:
        raise NotFoundError("Job", str(job_id))

    if current_user.role != "admin" and job.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    job.status = JobStatus.INACTIVE
    job.is_active = False

    await db.commit()
    await db.refresh(job)

    response = JobResponse.model_validate(job)
    response.owner_name = job.owner.name if job.owner else None
    return response


@router.delete("/{job_id}", response_model=MessageResponse)
async def delete_job(
    job_id: UUID,
    current_user: User = Depends(get_current_active_user_dep),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Delete job posting."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise NotFoundError("Job", str(job_id))

    if current_user.role != "admin" and job.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    await db.delete(job)
    await db.commit()

    return MessageResponse(message="Job deleted successfully")


@router.get("/areas/list", response_model=List[str])
async def list_areas() -> List[str]:
    """Get list of work areas."""
    return [area.value for area in WorkArea]


@router.get("/types/list", response_model=List[str])
async def list_job_types() -> List[str]:
    """Get list of job types."""
    return [jt.value for jt in JobType]