import uuid
from collections.abc import Iterator

import pytest
from flask import Flask
from flask.testing import FlaskClient
from sqlalchemy import text

from app import create_app
from app.database import get_engine


@pytest.fixture(scope="session")
def app() -> Flask:
    return create_app({"TESTING": True})


@pytest.fixture
def client(app: Flask) -> FlaskClient:
    return app.test_client()


@pytest.fixture(scope="session")
def db_available() -> bool:
    try:
        with get_engine().connect() as conn:
            conn.execute(text("SELECT 1 FROM users LIMIT 1"))
        return True
    except Exception:
        return False


@pytest.fixture
def requires_db(db_available: bool) -> None:
    if not db_available:
        pytest.skip("PostgreSQL with schema.sql loaded is not reachable (set DATABASE_URL)")


@pytest.fixture
def new_user(requires_db: None, client: FlaskClient) -> Iterator[dict[str, str]]:
    """Register a fresh user (logged in on ``client``) and delete it afterwards."""
    name = f"t_{uuid.uuid4().hex[:12]}"
    creds = {"username": name, "email": f"{name}@example.com", "password": "password123"}
    resp = client.post(
        "/auth/register",
        data={**creds, "password_confirm": creds["password"]},
    )
    assert resp.status_code == 302
    yield creds
    with get_engine().begin() as conn:
        conn.execute(text("DELETE FROM users WHERE username = :u"), {"u": name})
