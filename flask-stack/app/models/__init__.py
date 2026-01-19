"""
SQLAlchemy 2.0 Typed Mappings for Social Audit
Using Declarative Base with type annotations
"""

from typing import List, Optional
from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import (
    String, Text, Boolean, Integer, DateTime, ForeignKey,
    CheckConstraint, UniqueConstraint, Index, ARRAY, Enum as SQLEnum
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID, INET
import enum


class Base(DeclarativeBase):
    """Base class for all models"""
    pass


class NotificationType(enum.Enum):
    """Notification types matching PostgreSQL enum"""
    LIKE = "LIKE"
    RETWEET = "RETWEET"
    QUOTE_TWEET = "QUOTE_TWEET"
    REPLY = "REPLY"
    FOLLOW = "FOLLOW"
    MENTION = "MENTION"


class User(Base):
    __tablename__ = "users"
    
    # Primary Key
    id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    
    # Identity
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Profile
    display_name: Mapped[Optional[str]] = mapped_column(String(100))
    bio: Mapped[Optional[str]] = mapped_column(Text)
    avatar_url: Mapped[Optional[str]] = mapped_column(Text)
    banner_url: Mapped[Optional[str]] = mapped_column(Text)
    
    # Flags
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    is_private: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Denormalized counts
    followers_count: Mapped[int] = mapped_column(Integer, default=0)
    following_count: Mapped[int] = mapped_column(Integer, default=0)
    posts_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    last_active_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relationships
    posts: Mapped[List["Post"]] = relationship("Post", back_populates="user", foreign_keys="Post.user_id")
    followers: Mapped[List["Follow"]] = relationship("Follow", back_populates="followed", foreign_keys="Follow.followed_id")
    following: Mapped[List["Follow"]] = relationship("Follow", back_populates="follower", foreign_keys="Follow.follower_id")
    likes: Mapped[List["Like"]] = relationship("Like", back_populates="user")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="recipient", foreign_keys="Notification.user_id")
    sessions: Mapped[List["Session"]] = relationship("Session", back_populates="user")

    def __repr__(self) -> str:
        return f"<User {self.username}>"


class Post(Base):
    __tablename__ = "posts"
    
    # Primary Key
    id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Content
    content: Mapped[Optional[str]] = mapped_column(Text)
    media_urls: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text))
    
    # Threading
    parent_id: Mapped[Optional[UUID]] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"))
    root_post_id: Mapped[Optional[UUID]] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"))
    thread_depth: Mapped[int] = mapped_column(Integer, default=0)
    
    # Retweets & Quote Tweets
    original_post_id: Mapped[Optional[UUID]] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"))
    
    # Engagement counts
    likes_count: Mapped[int] = mapped_column(Integer, default=0)
    retweets_count: Mapped[int] = mapped_column(Integer, default=0)
    replies_count: Mapped[int] = mapped_column(Integer, default=0)
    quote_tweets_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="posts", foreign_keys=[user_id])
    parent: Mapped[Optional["Post"]] = relationship("Post", back_populates="replies", foreign_keys=[parent_id], remote_side="Post.id")
    replies: Mapped[List["Post"]] = relationship("Post", back_populates="parent", foreign_keys=[parent_id])
    original_post: Mapped[Optional["Post"]] = relationship("Post", foreign_keys=[original_post_id], remote_side="Post.id")
    likes: Mapped[List["Like"]] = relationship("Like", back_populates="post")
    
    # Indexes
    __table_args__ = (
        CheckConstraint(
            "(content IS NOT NULL AND content != '') OR (original_post_id IS NOT NULL)",
            name="content_or_retweet"
        ),
        CheckConstraint("thread_depth >= 0 AND thread_depth <= 10", name="valid_thread_depth"),
        Index("idx_posts_user_id", "user_id", "created_at"),
        Index("idx_posts_parent_id", "parent_id", "created_at"),
        Index("idx_posts_feed", "user_id", "created_at", postgresql_where=(is_deleted == False)),
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
    
    id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    follower_id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    followed_id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relationships
    follower: Mapped["User"] = relationship("User", back_populates="following", foreign_keys=[follower_id])
    followed: Mapped["User"] = relationship("User", back_populates="followers", foreign_keys=[followed_id])
    
    __table_args__ = (
        CheckConstraint("follower_id != followed_id", name="no_self_follow"),
        UniqueConstraint("follower_id", "followed_id", name="unique_follow"),
        Index("idx_follows_follower_id", "follower_id", "created_at"),
        Index("idx_follows_followed_id", "followed_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Follow {self.follower_id} -> {self.followed_id}>"


class Like(Base):
    __tablename__ = "likes"
    
    id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="likes")
    post: Mapped["Post"] = relationship("Post", back_populates="likes")
    
    __table_args__ = (
        UniqueConstraint("user_id", "post_id", name="unique_like"),
        Index("idx_likes_user_id", "user_id", "created_at"),
        Index("idx_likes_post_id", "post_id", "created_at"),
        Index("idx_likes_user_post", "user_id", "post_id"),
    )

    def __repr__(self) -> str:
        return f"<Like {self.user_id} -> {self.post_id}>"


class Notification(Base):
    __tablename__ = "notifications"
    
    id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    actor_id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[NotificationType] = mapped_column(SQLEnum(NotificationType), nullable=False)
    post_id: Mapped[Optional[UUID]] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"))
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Relationships
    recipient: Mapped["User"] = relationship("User", back_populates="notifications", foreign_keys=[user_id])
    actor: Mapped["User"] = relationship("User", foreign_keys=[actor_id])
    post: Mapped[Optional["Post"]] = relationship("Post")
    
    __table_args__ = (
        Index("idx_notifications_user_id", "user_id", "created_at"),
        Index("idx_notifications_unread", "user_id", "created_at", postgresql_where=(is_read == False)),
    )

    def __repr__(self) -> str:
        return f"<Notification {self.type.value} for {self.user_id}>"


class Session(Base):
    __tablename__ = "sessions"
    
    id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text)
    ip_address: Mapped[Optional[str]] = mapped_column(INET)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    last_activity_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="sessions")
    
    __table_args__ = (
        Index("idx_sessions_user_id", "user_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Session {self.id} for {self.user_id}>"
