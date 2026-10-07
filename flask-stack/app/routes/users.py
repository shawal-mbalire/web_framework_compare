"""
User routes
Profile pages and the social graph
"""

from typing import Any

from flask import Blueprint, abort, flash, jsonify, render_template, request
from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from werkzeug.wrappers import Response

from app.auth import current_user_id, login_required
from app.config import settings
from app.database import get_db
from app.models import Follow, Notification, NotificationType, User
from app.routes.posts import _back
from app.services import posts as post_service

bp = Blueprint("users", __name__)


def _load_user(username: str) -> User:
    user = get_db().scalar(select(User).where(func.lower(User.username) == username.lower()))
    if user is None:
        abort(404)
    return user


def _is_following(follower_id: Any, followed_id: Any) -> bool:
    return (
        get_db().scalar(
            select(Follow.id).where(
                Follow.follower_id == follower_id, Follow.followed_id == followed_id
            )
        )
        is not None
    )


@bp.route("/<username>", methods=["GET"])
def profile(username: str) -> str:
    """User profile with their posts"""
    user = _load_user(username)
    viewer_id = current_user_id()
    page = request.args.get("page", 1, type=int)
    result = post_service.user_feed(user.id, page, settings.PAGE_SIZE, viewer_id)
    return render_template(
        "pages/profile.html",
        profile=post_service.serialize_user(user),
        is_self=viewer_id == user.id,
        is_following=bool(viewer_id) and _is_following(viewer_id, user.id),
        posts=result.posts,
        page=result.page,
        has_more=result.has_more,
    )


@bp.route("/<username>/follow", methods=["POST"])
@login_required
def follow_user(username: str) -> Response:
    """Follow a user (idempotent)"""
    user = _load_user(username)
    viewer_id = current_user_id()
    assert viewer_id is not None
    if user.id == viewer_id:
        flash("You can't follow yourself", "error")
        return _back()

    db = get_db()
    inserted = db.execute(
        insert(Follow)
        .values(follower_id=viewer_id, followed_id=user.id)
        .on_conflict_do_nothing(constraint="unique_follow")
        .returning(Follow.id)
    ).scalar()
    if inserted:
        db.add(Notification(user_id=user.id, actor_id=viewer_id, type=NotificationType.FOLLOW))
    db.commit()
    return _back()


@bp.route("/<username>/unfollow", methods=["POST"])
@login_required
def unfollow_user(username: str) -> Response:
    """Unfollow a user"""
    user = _load_user(username)
    db = get_db()
    db.execute(
        delete(Follow).where(Follow.follower_id == current_user_id(), Follow.followed_id == user.id)
    )
    db.commit()
    return _back()


def _user_list(column: Any, match: Any, user: User) -> Response:
    users = get_db().scalars(
        select(User)
        .join(Follow, column == User.id)
        .where(match == user.id)
        .order_by(Follow.created_at.desc())
        .limit(100)
    )
    data = [post_service.serialize_user(u) for u in users]
    return jsonify({"users": data, "total": len(data)})


@bp.route("/<username>/followers", methods=["GET"])
def get_followers(username: str) -> Response:
    """Users following this user (JSON)"""
    return _user_list(Follow.follower_id, Follow.followed_id, _load_user(username))


@bp.route("/<username>/following", methods=["GET"])
def get_following(username: str) -> Response:
    """Users this user follows (JSON)"""
    return _user_list(Follow.followed_id, Follow.follower_id, _load_user(username))
