"""Database configuration and session management."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

from sqlalchemy import MetaData, event
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from core.config import settings


class Base(DeclarativeBase):
    """Base class for all models."""

    metadata = MetaData(
        naming_convention={
            "ix": "ix_%(column_0_label)s",
            "uq": "uq_%(table_name)s_%(column_0_name)s",
            "ck": "ck_%(table_name)s_%(constraint_name)s",
            "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
            "pk": "pk_%(table_name)s",
        }
    )


# Global engine and session factory
_engine: Optional[AsyncEngine] = None
_session_factory: Optional[async_sessionmaker[AsyncSession]] = None


def create_engine() -> AsyncEngine:
    """Create async database engine with proper configuration."""
    connect_args = {}
    if settings.DATABASE_URL.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    elif "postgresql" in settings.DATABASE_URL:
        # Render (and most managed Postgres) require TLS.
        # Allow opt-out via DATABASE_SSL=0; honor sslmode in the URL if present.
        enable_ssl = settings.DATABASE_SSL
        if enable_ssl and "sslmode=" not in settings.DATABASE_URL:
            connect_args = {"ssl": True}
        elif "sslmode=" in settings.DATABASE_URL:
            connect_args = {}

    engine = create_async_engine(
        settings.database_url_async,
        echo=settings.DEBUG,
        poolclass=NullPool if settings.DATABASE_URL.startswith("sqlite") else None,
        pool_size=settings.DATABASE_POOL_SIZE if not settings.DATABASE_URL.startswith("sqlite") else None,
        max_overflow=settings.DATABASE_MAX_OVERFLOW if not settings.DATABASE_URL.startswith("sqlite") else None,
        connect_args=connect_args,
    )

    # Enable foreign keys for SQLite
    if settings.DATABASE_URL.startswith("sqlite"):

        @event.listens_for(engine.sync_engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    return engine


def get_engine() -> AsyncEngine:
    """Get or create database engine."""
    global _engine
    if _engine is None:
        _engine = create_engine()
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Get or create session factory."""
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
            autocommit=False,
        )
    return _session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database session."""
    async with get_session_factory()() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    """Context manager for database session outside of FastAPI dependency."""
    async with get_session_factory()() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database - create all tables."""
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Close database connections."""
    global _engine, _session_factory
    if _engine:
        await _engine.dispose()
        _engine = None
    _session_factory = None