"""
Session helpers: password hashing, the current user and ``login_required``.
"""

from collections.abc import Callable
from functools import wraps
from uuid import UUID

import bcrypt
from flask import flash, g, redirect, request, session, url_for

from app.database import get_db
from app.models import User


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except ValueError:
        # Malformed hash (e.g. placeholder seed data) never matches
        return False


def login_user(user: User) -> None:
    session.clear()
    session["user_id"] = str(user.id)
    session["username"] = user.username


def current_user_id() -> UUID | None:
    raw = session.get("user_id")
    if not raw:
        return None
    try:
        return UUID(raw)
    except ValueError:
        session.clear()
        return None


def current_user() -> User | None:
    """The logged-in user, loaded once per request."""
    if "current_user" not in g:
        user_id = current_user_id()
        user = get_db().get(User, user_id) if user_id else None
        if user_id and user is None:
            # Stale session for a deleted user
            session.clear()
        g.current_user = user
    user_or_none: User | None = g.current_user
    return user_or_none


def login_required[**P, R](view: Callable[P, R]) -> Callable[P, R]:
    @wraps(view)
    def wrapped(*args: P.args, **kwargs: P.kwargs) -> R:
        if current_user() is None:
            flash("Please log in to continue", "error")
            return redirect(url_for("auth.login", next=request.full_path))  # type: ignore[return-value]
        return view(*args, **kwargs)

    return wrapped
