"""
Post queries and view-model serialization shared by the feed, post and user routes.
"""

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from flask import url_for
from sqlalchemy import ColumnElement, Select, func, literal_column, select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Follow, Like, Post, User

TRENDING_WINDOW = timedelta(hours=24)


@dataclass
class Page:
    posts: list[dict[str, Any]]
    page: int
    has_more: bool


def humanize(ts: datetime, now: datetime | None = None) -> str:
    """Compact relative timestamp: 45s, 12m, 3h, 2d, then 'Jan 5'."""
    now = now or datetime.now(UTC)
    seconds = int((now - ts).total_seconds())
    if seconds < 60:
        return f"{max(seconds, 0)}s"
    if seconds < 3600:
        return f"{seconds // 60}m"
    if seconds < 86400:
        return f"{seconds // 3600}h"
    if seconds < 7 * 86400:
        return f"{seconds // 86400}d"
    return f"{ts:%b} {ts.day}"


def serialize_user(user: User) -> dict[str, Any]:
    return {
        "id": str(user.id),
        "username": user.username,
        "display_name": user.display_name or user.username,
        "avatar": user.avatar_url or url_for("static", filename="img/avatar.svg"),
        "bio": user.bio,
        "is_verified": user.is_verified,
        "followers_count": user.followers_count,
        "following_count": user.following_count,
        "posts_count": user.posts_count,
    }


def _base_query() -> Select[Post]:
    return (
        select(Post)
        .where(Post.is_deleted.is_(False))
        .options(selectinload(Post.original_post).joinedload(Post.user))
    )


def _top_level() -> ColumnElement[bool]:
    return Post.parent_id.is_(None)


def _engagement_sets(viewer_id: UUID | None, post_ids: list[UUID]) -> tuple[set[UUID], set[UUID]]:
    if viewer_id is None or not post_ids:
        return set(), set()
    db = get_db()
    liked = set(
        db.scalars(
            select(Like.post_id).where(Like.user_id == viewer_id, Like.post_id.in_(post_ids))
        )
    )
    retweeted = set(
        db.scalars(
            select(Post.original_post_id).where(
                Post.user_id == viewer_id,
                Post.original_post_id.in_(post_ids),
                Post.content.is_(None),
                Post.is_deleted.is_(False),
            )
        )
    )
    return liked, {pid for pid in retweeted if pid is not None}


def serialize_posts(posts: list[Post], viewer_id: UUID | None) -> list[dict[str, Any]]:
    """Turn ORM rows into template-friendly dicts.

    A pure retweet is rendered as the original post with a "reposted by" banner,
    so engagement (likes, retweets) always targets the original.
    """
    displayed = [p.original_post if p.is_retweet and p.original_post else p for p in posts]
    liked, retweeted = _engagement_sets(viewer_id, [p.id for p in displayed])

    result = []
    for row, post in zip(posts, displayed, strict=True):
        result.append(
            {
                "id": str(post.id),
                "author": serialize_user(post.user),
                "content": post.content or "",
                "created_at": humanize(post.created_at),
                "created_at_iso": post.created_at.isoformat(),
                "likes_count": post.likes_count,
                "retweets_count": post.retweets_count,
                "replies_count": post.replies_count,
                "is_liked": post.id in liked,
                "is_retweeted": post.id in retweeted,
                "reposted_by": row.user.username if row is not post else None,
                "parent_id": str(post.parent_id) if post.parent_id else None,
            }
        )
    return result


def _paginate(query: Select[Post], page: int, page_size: int, viewer_id: UUID | None) -> Page:
    page = max(page, 1)
    rows = list(
        get_db().scalars(
            query.order_by(Post.created_at.desc(), Post.id.desc())
            .limit(page_size + 1)
            .offset((page - 1) * page_size)
        )
    )
    has_more = len(rows) > page_size
    return Page(serialize_posts(rows[:page_size], viewer_id), page, has_more)


def home_feed(user_id: UUID, page: int, page_size: int) -> Page:
    """Top-level posts by the user and everyone they follow."""
    followed = select(Follow.followed_id).where(Follow.follower_id == user_id)
    query = _base_query().where(
        _top_level(), (Post.user_id == user_id) | Post.user_id.in_(followed)
    )
    return _paginate(query, page, page_size, user_id)


def explore_feed(page: int, page_size: int, viewer_id: UUID | None) -> Page:
    return _paginate(_base_query().where(_top_level()), page, page_size, viewer_id)


def user_feed(user_id: UUID, page: int, page_size: int, viewer_id: UUID | None) -> Page:
    query = _base_query().where(_top_level(), Post.user_id == user_id)
    return _paginate(query, page, page_size, viewer_id)


def search_posts(q: str, page: int, page_size: int, viewer_id: UUID | None) -> Page:
    # Same expression as idx_posts_content_search, so the GIN index is used
    tsvector = func.to_tsvector(literal_column("'english'"), Post.content)
    tsquery = func.websearch_to_tsquery(literal_column("'english'"), q)
    query = _base_query().where(Post.content.is_not(None), tsvector.op("@@")(tsquery))
    return _paginate(query, page, page_size, viewer_id)


def trending_posts(limit: int, viewer_id: UUID | None) -> list[dict[str, Any]]:
    """engagement_score = (likes + retweets*2 + replies*3) / hours_since_posted"""
    hours = func.greatest(
        func.extract("epoch", func.now() - Post.created_at) / 3600, literal_column("1")
    )
    score = (Post.likes_count + Post.retweets_count * 2 + Post.replies_count * 3) / hours
    query = (
        _base_query()
        .where(
            _top_level(),
            Post.content.is_not(None),
            Post.created_at > datetime.now(UTC) - TRENDING_WINDOW,
        )
        .order_by(score.desc(), Post.created_at.desc())
        .limit(limit)
    )
    return serialize_posts(list(get_db().scalars(query)), viewer_id)


def get_post(post_id: UUID) -> Post | None:
    return get_db().scalar(_base_query().where(Post.id == post_id))


def replies_to(post_id: UUID, viewer_id: UUID | None) -> list[dict[str, Any]]:
    query = _base_query().where(Post.parent_id == post_id).order_by(Post.created_at.asc())
    return serialize_posts(list(get_db().scalars(query)), viewer_id)


def suggested_users(viewer_id: UUID, limit: int = 3) -> list[dict[str, Any]]:
    followed = select(Follow.followed_id).where(Follow.follower_id == viewer_id)
    query = (
        select(User)
        .where(User.id != viewer_id, User.id.not_in(followed))
        .order_by(User.followers_count.desc(), User.created_at.asc())
        .limit(limit)
    )
    return [serialize_user(u) for u in get_db().scalars(query)]
