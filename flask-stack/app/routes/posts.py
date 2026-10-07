"""
Posts routes
Create, read and delete posts; replies, likes and retweets
"""

from uuid import UUID

from flask import Blueprint, abort, flash, redirect, render_template, request, url_for
from sqlalchemy import delete, select, update
from sqlalchemy.dialects.postgresql import insert
from werkzeug.wrappers import Response

from app.auth import current_user, current_user_id, login_required
from app.database import get_db
from app.models import Like, Notification, NotificationType, Post, User
from app.services import posts as post_service

bp = Blueprint("posts", __name__)

MAX_LENGTH = 280
MAX_THREAD_DEPTH = 10


def _back() -> Response:
    """Redirect to the referring page (same-site only), falling back to home."""
    ref = request.referrer
    if ref and ref.startswith(request.host_url):
        return redirect(ref)
    return redirect(url_for("feed.home"))


def _load_post(post_id: UUID) -> Post:
    post = post_service.get_post(post_id)
    if post is None:
        abort(404)
    return post


def _notify(recipient_id: UUID, actor_id: UUID, kind: NotificationType, post_id: UUID) -> None:
    if recipient_id != actor_id:
        get_db().add(
            Notification(user_id=recipient_id, actor_id=actor_id, type=kind, post_id=post_id)
        )


@bp.route("/create", methods=["POST"])
@login_required
def create_post() -> Response:
    """Create a post or a reply (when parent_id is set)"""
    user = current_user()
    assert user is not None
    content = request.form.get("content", "").strip()
    raw_parent = request.form.get("parent_id") or None

    if not content or len(content) > MAX_LENGTH:
        flash(f"Post must be between 1 and {MAX_LENGTH} characters", "error")
        return _back()

    post = Post(user_id=user.id, content=content)
    if raw_parent:
        try:
            parent = _load_post(UUID(raw_parent))
        except ValueError:
            abort(400)
        if parent.thread_depth >= MAX_THREAD_DEPTH:
            flash("This thread is too deep to reply to", "error")
            return _back()
        post.parent_id = parent.id
        post.root_post_id = parent.root_post_id or parent.id
        post.thread_depth = parent.thread_depth + 1

    db = get_db()
    db.add(post)
    db.flush()
    if raw_parent:
        _notify(parent.user_id, user.id, NotificationType.REPLY, post.id)
    db.commit()

    flash("Reply posted!" if raw_parent else "Post created!", "success")
    if raw_parent:
        return redirect(url_for("posts.view_post", post_id=raw_parent))
    return _back()


@bp.route("/<uuid:post_id>", methods=["GET"])
def view_post(post_id: UUID) -> str:
    """View a single post with its direct replies"""
    post = _load_post(post_id)
    viewer_id = current_user_id()
    [serialized] = post_service.serialize_posts([post], viewer_id)
    replies = post_service.replies_to(post_id, viewer_id)
    return render_template("pages/post.html", post=serialized, replies=replies)


@bp.route("/<uuid:post_id>/delete", methods=["POST"])
@login_required
def delete_post(post_id: UUID) -> Response:
    """Soft-delete a post owned by the current user"""
    post = _load_post(post_id)
    if post.user_id != current_user_id():
        abort(403)

    db = get_db()
    post.is_deleted = True
    # Count triggers only fire on hard DELETE, so keep denormalized counts in sync here
    db.execute(update(User).where(User.id == post.user_id).values(posts_count=User.posts_count - 1))
    if post.parent_id:
        db.execute(
            update(Post)
            .where(Post.id == post.parent_id)
            .values(replies_count=Post.replies_count - 1)
        )
    db.commit()
    flash("Post deleted", "success")
    return redirect(url_for("feed.home"))


@bp.route("/<uuid:post_id>/like", methods=["POST"])
@login_required
def like_post(post_id: UUID) -> Response:
    """Like a post (idempotent)"""
    post = _load_post(post_id)
    user_id = current_user_id()
    assert user_id is not None
    db = get_db()
    inserted = db.execute(
        insert(Like)
        .values(user_id=user_id, post_id=post.id)
        .on_conflict_do_nothing(constraint="unique_like")
        .returning(Like.id)
    ).scalar()
    if inserted:
        _notify(post.user_id, user_id, NotificationType.LIKE, post.id)
    db.commit()
    return _back()


@bp.route("/<uuid:post_id>/unlike", methods=["POST"])
@login_required
def unlike_post(post_id: UUID) -> Response:
    """Unlike a post"""
    db = get_db()
    db.execute(delete(Like).where(Like.post_id == post_id, Like.user_id == current_user_id()))
    db.commit()
    return _back()


@bp.route("/<uuid:post_id>/retweet", methods=["POST"])
@login_required
def retweet_post(post_id: UUID) -> Response:
    """Retweet a post (a new post with original_post_id set and no content)"""
    post = _load_post(post_id)
    if post.is_retweet and post.original_post_id:
        post = _load_post(post.original_post_id)
    user_id = current_user_id()
    assert user_id is not None

    db = get_db()
    existing = db.scalar(
        select(Post.id).where(
            Post.user_id == user_id,
            Post.original_post_id == post.id,
            Post.content.is_(None),
            Post.is_deleted.is_(False),
        )
    )
    if existing is None:
        retweet = Post(user_id=user_id, original_post_id=post.id)
        db.add(retweet)
        db.flush()
        _notify(post.user_id, user_id, NotificationType.RETWEET, post.id)
        db.commit()
        flash("Retweeted!", "success")
    return _back()


@bp.route("/<uuid:post_id>/unretweet", methods=["POST"])
@login_required
def unretweet_post(post_id: UUID) -> Response:
    """Remove a retweet (hard delete so the count trigger fires)"""
    db = get_db()
    db.execute(
        delete(Post).where(
            Post.user_id == current_user_id(),
            Post.original_post_id == post_id,
            Post.content.is_(None),
        )
    )
    db.commit()
    return _back()
