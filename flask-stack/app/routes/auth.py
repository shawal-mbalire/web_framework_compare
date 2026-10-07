"""
Authentication routes
Cookie-session authentication with bcrypt password hashes
"""

from flask import Blueprint, flash, redirect, render_template, request, session, url_for
from pydantic import ValidationError
from sqlalchemy import func, or_, select
from werkzeug.wrappers import Response

from app.auth import hash_password, login_user, verify_password
from app.database import get_db
from app.models import User
from app.schemas import UserCreate

bp = Blueprint("auth", __name__)


def _safe_next(target: str | None) -> str:
    """Only follow same-site relative redirects (avoid open redirects)."""
    if target and target.startswith("/") and not target.startswith("//"):
        return target
    return url_for("feed.home")


@bp.route("/register", methods=["GET", "POST"])
def register() -> str | Response:
    """Register a new user"""
    if request.method == "GET":
        return render_template("pages/auth/register.html")

    form = request.form
    if form.get("password", "") != form.get("password_confirm", ""):
        flash("Passwords do not match", "error")
        return redirect(url_for("auth.register"))

    try:
        data = UserCreate(
            username=form.get("username", "").strip(),
            email=form.get("email", "").strip().lower(),
            password=form.get("password", ""),
            display_name=form.get("display_name", "").strip() or None,
        )
    except ValidationError as exc:
        for error in exc.errors():
            field = ".".join(str(loc) for loc in error["loc"])
            flash(f"{field}: {error['msg']}", "error")
        return redirect(url_for("auth.register"))

    db = get_db()
    taken = db.scalar(
        select(User.id).where(
            or_(func.lower(User.username) == data.username.lower(), User.email == data.email)
        )
    )
    if taken:
        flash("Username or email is already registered", "error")
        return redirect(url_for("auth.register"))

    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        display_name=data.display_name,
    )
    db.add(user)
    db.commit()

    login_user(user)
    flash(f"Welcome, @{user.username}!", "success")
    return redirect(url_for("feed.home"))


@bp.route("/login", methods=["GET", "POST"])
def login() -> str | Response:
    """Login user"""
    if request.method == "GET":
        return render_template("pages/auth/login.html")

    username = request.form.get("username", "").strip()
    password = request.form.get("password", "")
    if not username or not password:
        flash("Username and password are required", "error")
        return redirect(url_for("auth.login"))

    user = get_db().scalar(
        select(User).where(
            or_(func.lower(User.username) == username.lower(), User.email == username.lower())
        )
    )
    if user is None or not verify_password(password, user.password_hash):
        flash("Invalid username or password", "error")
        return redirect(url_for("auth.login"))

    login_user(user)
    session.permanent = request.form.get("remember") == "1"
    flash("Login successful!", "success")
    return redirect(_safe_next(request.args.get("next")))


@bp.route("/logout", methods=["POST"])
def logout() -> Response:
    """Logout user"""
    session.clear()
    flash("Logged out successfully", "success")
    return redirect(url_for("auth.login"))
