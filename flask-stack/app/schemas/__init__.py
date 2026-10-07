"""
Pydantic v2 Schemas for Request/Response validation
Type-safe data validation and serialization
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

# ============================================================================
# User Schemas
# ============================================================================


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=20, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    display_name: str | None = Field(None, max_length=100)
    bio: str | None = Field(None, max_length=500)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)


class UserUpdate(BaseModel):
    display_name: str | None = Field(None, max_length=100)
    bio: str | None = Field(None, max_length=500)
    avatar_url: str | None = None
    banner_url: str | None = None


class UserPublic(UserBase):
    id: UUID
    avatar_url: str | None = None
    banner_url: str | None = None
    is_verified: bool
    is_private: bool
    followers_count: int
    following_count: int
    posts_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserPrivate(UserPublic):
    """Extended user data for authenticated user"""

    email: EmailStr
    last_active_at: datetime


# ============================================================================
# Auth Schemas
# ============================================================================


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


# ============================================================================
# Post Schemas
# ============================================================================


class PostBase(BaseModel):
    content: str | None = Field(None, max_length=280)
    media_urls: list[str] | None = None


class PostCreate(PostBase):
    parent_id: UUID | None = None  # For replies
    original_post_id: UUID | None = None  # For retweets/quote tweets


class PostUpdate(BaseModel):
    content: str = Field(..., max_length=280)


class PostPublic(PostBase):
    id: UUID
    user_id: UUID
    user: UserPublic
    parent_id: UUID | None = None
    original_post_id: UUID | None = None
    thread_depth: int
    likes_count: int
    retweets_count: int
    replies_count: int
    quote_tweets_count: int
    created_at: datetime
    is_liked: bool = False  # Computed field: did current user like this?
    is_retweeted: bool = False  # Computed field
    is_bookmarked: bool = False  # Computed field

    # For quote tweets, include the original post
    original_post: "PostPublic | None" = None

    model_config = ConfigDict(from_attributes=True)


class ThreadResponse(BaseModel):
    """Response for threaded conversations"""

    root_post: PostPublic
    replies: list[PostPublic]
    total_replies: int


# ============================================================================
# Feed Schemas
# ============================================================================


class FeedResponse(BaseModel):
    posts: list[PostPublic]
    next_cursor: str | None = None
    has_more: bool


class CursorPagination(BaseModel):
    cursor: str | None = None
    limit: int = Field(default=20, ge=1, le=100)


# ============================================================================
# Social Schemas
# ============================================================================


class FollowPublic(BaseModel):
    id: UUID
    follower_id: UUID
    followed_id: UUID
    created_at: datetime
    follower: UserPublic
    followed: UserPublic

    model_config = ConfigDict(from_attributes=True)


class FollowersResponse(BaseModel):
    users: list[UserPublic]
    total: int


# ============================================================================
# Notification Schemas
# ============================================================================


class NotificationPublic(BaseModel):
    id: UUID
    type: str  # LIKE, RETWEET, REPLY, FOLLOW, MENTION
    actor: UserPublic
    post: PostPublic | None = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationsResponse(BaseModel):
    notifications: list[NotificationPublic]
    unread_count: int
    has_more: bool


# ============================================================================
# Engagement Schemas
# ============================================================================


class LikeResponse(BaseModel):
    liked: bool
    likes_count: int


class RetweetResponse(BaseModel):
    retweeted: bool
    retweets_count: int


# ============================================================================
# Error Schemas
# ============================================================================


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
    code: str | None = None


# ============================================================================
# Analytics/Stats Schemas
# ============================================================================


class UserStats(BaseModel):
    total_posts: int
    total_likes_received: int
    total_retweets_received: int
    followers_count: int
    following_count: int
    posts_this_week: int
    engagement_rate: float


class TrendingPost(PostPublic):
    engagement_score: (
        float  # Custom metric: (likes + retweets * 2 + replies * 3) / hours_since_posted
    )


class TrendingResponse(BaseModel):
    posts: list[TrendingPost]
    timeframe: str  # "24h", "7d", "30d"
