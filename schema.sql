-- ============================================================================
-- Social Architecture Audit - Advanced Relational Schema
-- Twitter/X Clone Database Design
-- 
-- Features:
-- - Threaded conversations (parent_id self-reference)
-- - Retweets and Quote Tweets (original_post_id pointer)
-- - Social graph (Follows)
-- - Engagement tracking (Likes)
-- - Real-time notifications
-- - Optimized indexes for high-performance queries
-- ============================================================================

-- Enable UUID extension for better distributed ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_private BOOLEAN DEFAULT FALSE,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_is_verified ON users(is_verified) WHERE is_verified = TRUE;

-- ============================================================================
-- POSTS TABLE
-- Handles: Regular Tweets, Replies (parent_id), Retweets, and Quote Tweets
-- ============================================================================
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Content
    content TEXT,
    media_urls TEXT[], -- Array of media URLs
    
    -- Threading: Hierarchical replies
    parent_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    root_post_id UUID REFERENCES posts(id) ON DELETE CASCADE, -- Denormalized for performance
    thread_depth INTEGER DEFAULT 0,
    
    -- Retweets & Quote Tweets
    -- If original_post_id is set and content is NULL: Pure Retweet
    -- If original_post_id is set and content is NOT NULL: Quote Tweet
    original_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    is_retweet BOOLEAN GENERATED ALWAYS AS (original_post_id IS NOT NULL AND content IS NULL) STORED,
    is_quote_tweet BOOLEAN GENERATED ALWAYS AS (original_post_id IS NOT NULL AND content IS NOT NULL) STORED,
    
    -- Engagement metrics (denormalized for performance)
    likes_count INTEGER DEFAULT 0,
    retweets_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    quote_tweets_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- Constraints
    CONSTRAINT content_or_retweet CHECK (
        (content IS NOT NULL AND content != '') OR 
        (original_post_id IS NOT NULL)
    ),
    CONSTRAINT valid_thread_depth CHECK (thread_depth >= 0 AND thread_depth <= 10)
);

-- Indexes for high-performance queries
CREATE INDEX idx_posts_user_id ON posts(user_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_posts_parent_id ON posts(parent_id, created_at DESC) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_posts_root_post_id ON posts(root_post_id, created_at DESC) WHERE root_post_id IS NOT NULL;
CREATE INDEX idx_posts_original_post_id ON posts(original_post_id, created_at DESC) WHERE original_post_id IS NOT NULL;
CREATE INDEX idx_posts_created_at ON posts(created_at DESC) WHERE is_deleted = FALSE;

-- Composite index for feed queries (most critical for performance)
CREATE INDEX idx_posts_feed ON posts(user_id, created_at DESC) 
    WHERE is_deleted = FALSE AND parent_id IS NULL;

-- GIN index for full-text search on content
CREATE INDEX idx_posts_content_search ON posts USING gin(to_tsvector('english', content)) 
    WHERE content IS NOT NULL AND is_deleted = FALSE;

-- ============================================================================
-- FOLLOWS TABLE
-- The Social Graph
-- ============================================================================
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent self-follows and duplicate follows
    CONSTRAINT no_self_follow CHECK (follower_id != followed_id),
    CONSTRAINT unique_follow UNIQUE (follower_id, followed_id)
);

-- Critical indexes for feed generation and social graph queries
CREATE INDEX idx_follows_follower_id ON follows(follower_id, created_at DESC);
CREATE INDEX idx_follows_followed_id ON follows(followed_id, created_at DESC);

-- ============================================================================
-- LIKES TABLE
-- Engagement tracking
-- ============================================================================
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate likes
    CONSTRAINT unique_like UNIQUE (user_id, post_id)
);

-- Indexes for like queries
CREATE INDEX idx_likes_user_id ON likes(user_id, created_at DESC);
CREATE INDEX idx_likes_post_id ON likes(post_id, created_at DESC);

-- Composite index for checking if user liked a post (critical for UI)
CREATE INDEX idx_likes_user_post ON likes(user_id, post_id);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- Real-time engagement engine
-- ============================================================================
CREATE TYPE notification_type AS ENUM (
    'LIKE',
    'RETWEET',
    'QUOTE_TWEET',
    'REPLY',
    'FOLLOW',
    'MENTION'
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Recipient
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Actor (who triggered the notification)
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification details
    type notification_type NOT NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE, -- NULL for FOLLOW notifications
    
    -- State
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT notification_post_required CHECK (
        (type = 'FOLLOW' AND post_id IS NULL) OR
        (type != 'FOLLOW' AND post_id IS NOT NULL)
    )
);

-- Indexes for notification queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at DESC) 
    WHERE is_read = FALSE;
CREATE INDEX idx_notifications_actor_id ON notifications(actor_id, created_at DESC);

-- ============================================================================
-- BOOKMARKS TABLE (Bonus feature for completeness)
-- ============================================================================
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_bookmark UNIQUE (user_id, post_id)
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id, created_at DESC);

-- ============================================================================
-- SESSIONS TABLE
-- JWT/Session-based authentication
-- ============================================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id, created_at DESC);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash) WHERE is_revoked = FALSE;
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at) WHERE is_revoked = FALSE;

-- ============================================================================
-- TRIGGERS FOR DENORMALIZED COUNTS
-- Maintain consistency for performance-critical count fields
-- ============================================================================

-- Update users.followers_count
CREATE OR REPLACE FUNCTION update_followers_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET followers_count = followers_count + 1 WHERE id = NEW.followed_id;
        UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.followed_id;
        UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_followers_count
AFTER INSERT OR DELETE ON follows
FOR EACH ROW EXECUTE FUNCTION update_followers_count();

-- Update posts.likes_count
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- Update posts.replies_count, retweets_count, quote_tweets_count
CREATE OR REPLACE FUNCTION update_post_engagement_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update reply count
        IF NEW.parent_id IS NOT NULL THEN
            UPDATE posts SET replies_count = replies_count + 1 WHERE id = NEW.parent_id;
        END IF;
        
        -- Update retweet/quote tweet counts
        IF NEW.original_post_id IS NOT NULL THEN
            IF NEW.is_retweet THEN
                UPDATE posts SET retweets_count = retweets_count + 1 WHERE id = NEW.original_post_id;
            ELSIF NEW.is_quote_tweet THEN
                UPDATE posts SET quote_tweets_count = quote_tweets_count + 1 WHERE id = NEW.original_post_id;
            END IF;
        END IF;
        
        -- Update user's posts count
        UPDATE users SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Update reply count
        IF OLD.parent_id IS NOT NULL THEN
            UPDATE posts SET replies_count = GREATEST(0, replies_count - 1) WHERE id = OLD.parent_id;
        END IF;
        
        -- Update retweet/quote tweet counts
        IF OLD.original_post_id IS NOT NULL THEN
            IF OLD.is_retweet THEN
                UPDATE posts SET retweets_count = GREATEST(0, retweets_count - 1) WHERE id = OLD.original_post_id;
            ELSIF OLD.is_quote_tweet THEN
                UPDATE posts SET quote_tweets_count = GREATEST(0, quote_tweets_count - 1) WHERE id = OLD.original_post_id;
            END IF;
        END IF;
        
        -- Update user's posts count
        UPDATE users SET posts_count = GREATEST(0, posts_count - 1) WHERE id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_engagement_counts
AFTER INSERT OR DELETE ON posts
FOR EACH ROW EXECUTE FUNCTION update_post_engagement_counts();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_posts_updated_at BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user feed (posts from followed users)
CREATE OR REPLACE FUNCTION get_user_feed(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    post_id UUID,
    user_id UUID,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    likes_count INTEGER,
    retweets_count INTEGER,
    replies_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.content,
        p.created_at,
        p.likes_count,
        p.retweets_count,
        p.replies_count
    FROM posts p
    WHERE p.user_id IN (
        SELECT followed_id FROM follows WHERE follower_id = p_user_id
    )
    AND p.is_deleted = FALSE
    AND p.parent_id IS NULL -- Only top-level posts
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to get thread (recursive)
CREATE OR REPLACE FUNCTION get_thread(p_post_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    content TEXT,
    parent_id UUID,
    thread_depth INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    likes_count INTEGER,
    replies_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE thread_tree AS (
        -- Root post
        SELECT 
            p.id,
            p.user_id,
            p.content,
            p.parent_id,
            p.thread_depth,
            p.created_at,
            p.likes_count,
            p.replies_count,
            ARRAY[p.id] as path
        FROM posts p
        WHERE p.id = p_post_id AND p.is_deleted = FALSE
        
        UNION ALL
        
        -- Recursive replies
        SELECT 
            p.id,
            p.user_id,
            p.content,
            p.parent_id,
            p.thread_depth,
            p.created_at,
            p.likes_count,
            p.replies_count,
            tt.path || p.id
        FROM posts p
        INNER JOIN thread_tree tt ON p.parent_id = tt.id
        WHERE p.is_deleted = FALSE
    )
    SELECT 
        tt.id,
        tt.user_id,
        tt.content,
        tt.parent_id,
        tt.thread_depth,
        tt.created_at,
        tt.likes_count,
        tt.replies_count
    FROM thread_tree tt
    ORDER BY tt.path;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA (For development/testing)
-- ============================================================================

-- Insert sample users
INSERT INTO users (username, email, password_hash, display_name, bio, is_verified) VALUES
('elonmusk', 'elon@x.com', '$2b$12$KIXxLV7MvH.hashed', 'Elon Musk', 'Twitter 2.0', TRUE),
('naval', 'naval@angellist.com', '$2b$12$KIXxLV7MvH.hashed', 'Naval', 'Happiness is a choice', TRUE),
('pmarca', 'marc@a16z.com', '$2b$12$KIXxLV7MvH.hashed', 'Marc Andreessen', 'Software is eating the world', TRUE),
('paulg', 'pg@ycombinator.com', '$2b$12$KIXxLV7MvH.hashed', 'Paul Graham', 'Founder Y Combinator', TRUE),
('sama', 'sam@openai.com', '$2b$12$KIXxLV7MvH.hashed', 'Sam Altman', 'OpenAI CEO', TRUE);

-- Create some follows
INSERT INTO follows (follower_id, followed_id)
SELECT u1.id, u2.id
FROM users u1
CROSS JOIN users u2
WHERE u1.username = 'naval' AND u2.username IN ('elonmusk', 'pmarca', 'paulg');

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================
-- 1. The "Feed Query" is optimized using idx_posts_feed composite index
-- 2. Denormalized counts prevent expensive COUNT(*) queries
-- 3. UUID v4 provides better distribution for sharding than SERIAL
-- 4. Partial indexes (WHERE clauses) reduce index size and improve performance
-- 5. GIN index on content enables full-text search capabilities
-- 6. Recursive CTE for threads is efficient for typical thread depths (< 10)
-- 
-- SCALING CONSIDERATIONS:
-- - For "Celebrity" users with millions of followers, implement fan-out-on-write
--   using a materialized view or denormalized timeline table
-- - Consider partitioning posts table by created_at for time-series queries
-- - Implement read replicas for feed generation queries
-- ============================================================================
