"""
Database engine and request-scoped session management (SQLAlchemy 2.0).

The schema itself is owned by ../schema.sql (shared by every stack), so this
module never calls ``create_all``.
"""

from flask import Flask, g
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings

_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


def _database_url() -> str:
    url = settings.DATABASE_URL
    # Use the psycopg 3 driver for plain postgresql:// URLs
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def get_engine() -> Engine:
    """Create the engine lazily so the app can be imported without a database."""
    global _engine, _session_factory
    if _engine is None:
        _engine = create_engine(
            _database_url(),
            echo=settings.SQL_ECHO,
            pool_size=settings.DATABASE_POOL_SIZE,
            max_overflow=settings.DATABASE_MAX_OVERFLOW,
            pool_pre_ping=True,
            pool_recycle=3600,
        )
        _session_factory = sessionmaker(_engine, expire_on_commit=False)
    return _engine


def get_db() -> Session:
    """Return the session bound to the current request (created on first use)."""
    if "db" not in g:
        get_engine()
        assert _session_factory is not None
        g.db = _session_factory()
    db: Session = g.db
    return db


def close_db(exc: BaseException | None = None) -> None:
    db: Session | None = g.pop("db", None)
    if db is None:
        return
    if exc is not None:
        db.rollback()
    db.close()


def init_app(app: Flask) -> None:
    app.teardown_appcontext(close_db)
