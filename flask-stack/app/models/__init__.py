"""
SQLAlchemy 2.0 typed mappings for the shared schema (../schema.sql).

schema.sql is the source of truth for indexes, triggers and generated columns;
these mappings only describe what the application reads and writes.
"""

import enum
from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    ARRAY,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import INET
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all models"""


class NotificationType(enum.Enum):
    """Notification types matching the PostgreSQL ``notification_type`` enum"""

    LIKE = "LIKE"
    RETWEET = "RETWEET"
    QUOTE_TWEET = "QUOTE_TWEET"
    REPLY = "REPLY"
    FOLLOW = "FOLLOW"
    MENTION = "MENTION"


def _uuid_pk() -> Mapped[UUID]:
    return mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, server_default=func.uuid_generate_v4()
    )


def _created_at() -> Mapped[datetime]:
    return mapped_column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = _uuid_pk()
    username: Mapped[str] = mapped_column(String(50), unique=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))

    display_name: Mapped[str | None] = mapped_column(String(100))
    bio: Mapped[str | None] = mapped_column(Text)
    avatar_url: Mapped[str | None] = mapped_column(Text)
    banner_url: Mapped[str | None] = mapped_column(Text)

    is_verified: Mapped[bool] = mapped_column(Boolean, server_default="false")
    is_private: Mapped[bool] = mapped_column(Boolean, server_default="false")

    # Maintained by database triggers
    followers_count: Mapped[int] = mapped_column(Integer, server_default="0")
    following_count: Mapped[int] = mapped_column(Integer, server_default="0")
    posts_count: Mapped[int] = mapped_column(Integer, server_default="0")

    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = _created_at()
    last_active_at: Mapped[datetime] = _created_at()

    def __repr__(self) -> str:
        return f"<User {self.username}>"


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    content: Mapped[str | None] = mapped_column(Text)
    media_urls: Mapped[list[str] | None] = mapped_column(ARRAY(Text))

    # Threading
    parent_id: Mapped[UUID | None] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"))
    root_post_id: Mapped[UUID | None] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"))
    thread_depth: Mapped[int] = mapped_column(Integer, server_default="0")

    # Retweets & quote tweets
    original_post_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE")
    )

    # Maintained by database triggers
    likes_count: Mapped[int] = mapped_column(Integer, server_default="0")
    retweets_count: Mapped[int] = mapped_column(Integer, server_default="0")
    replies_count: Mapped[int] = mapped_column(Integer, server_default="0")
    quote_tweets_count: Mapped[int] = mapped_column(Integer, server_default="0")

    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = _created_at()
    is_deleted: Mapped[bool] = mapped_column(Boolean, server_default="false")

    user: Mapped[User] = relationship(foreign_keys=[user_id], lazy="joined")
    original_post: Mapped["Post | None"] = relationship(
        foreign_keys=[original_post_id], remote_side="Post.id"
    )

    @property
    def is_retweet(self) -> bool:
        return self.original_post_id is not None and self.content is None

    @property
    def is_quote_tweet(self) -> bool:
        return self.original_post_id is not None and self.content is not None

    def __repr__(self) -> str:
        return f"<Post {self.id}>"


class Follow(Base):
    __tablename__ = "follows"

    id: Mapped[UUID] = _uuid_pk()
    follower_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    followed_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = _created_at()

    def __repr__(self) -> str:
        return f"<Follow {self.follower_id} -> {self.followed_id}>"


class Like(Base):
    __tablename__ = "likes"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    post_id: Mapped[UUID] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = _created_at()

    def __repr__(self) -> str:
        return f"<Like {self.user_id} -> {self.post_id}>"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    actor_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    type: Mapped[NotificationType] = mapped_column(
        SQLEnum(NotificationType, name="notification_type", create_type=False)
    )
    post_id: Mapped[UUID | None] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"))
    is_read: Mapped[bool] = mapped_column(Boolean, server_default="false")
    created_at: Mapped[datetime] = _created_at()
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    actor: Mapped[User] = relationship(foreign_keys=[actor_id], lazy="joined")
    post: Mapped[Post | None] = relationship(foreign_keys=[post_id])

    def __repr__(self) -> str:
        return f"<Notification {self.type.value} for {self.user_id}>"


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[UUID] = _uuid_pk()
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    token_hash: Mapped[str] = mapped_column(String(255), unique=True)
    user_agent: Mapped[str | None] = mapped_column(Text)
    ip_address: Mapped[str | None] = mapped_column(INET)
    created_at: Mapped[datetime] = _created_at()
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    last_activity_at: Mapped[datetime] = _created_at()
    is_revoked: Mapped[bool] = mapped_column(Boolean, server_default="false")

    def __repr__(self) -> str:
        return f"<Session {self.id} for {self.user_id}>"
