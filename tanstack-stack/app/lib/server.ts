/**
 * Server functions: type-safe RPC. Handler bodies (and the server-only imports
 * they use) are stripped from the client bundle by the TanStack Start compiler.
 */
import { createServerFn } from '@tanstack/react-start';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { sql } from './db.server';
import {
  loginSchema,
  postCreateSchema,
  postIdSchema,
  registerSchema,
  type FeedPage,
  type PostPublic,
  type SessionUser,
} from './schemas';
import { getAppSession, getSessionUser, requireSessionUser } from './session.server';

const PAGE_SIZE = 20;

// ============================================================================
// Auth
// ============================================================================

export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionUser | null> => getSessionUser()
);

export const loginFn = createServerFn({ method: 'POST' })
  .validator(loginSchema)
  .handler(async ({ data }): Promise<SessionUser> => {
    const [user] = await sql<{ id: string; username: string; passwordHash: string }[]>`
      SELECT id, username, password_hash FROM users
      WHERE lower(username) = lower(${data.username}) OR email = lower(${data.username})
    `;
    const valid = user ? await bcrypt.compare(data.password, user.passwordHash).catch(() => false) : false;
    if (!user || !valid) throw new Error('Invalid username or password');

    const session = await getAppSession();
    await session.update({ id: user.id, username: user.username });
    return { id: user.id, username: user.username };
  });

export const registerFn = createServerFn({ method: 'POST' })
  .validator(registerSchema)
  .handler(async ({ data }): Promise<SessionUser> => {
    const passwordHash = await bcrypt.hash(data.password, 12);
    const [user] = await sql<SessionUser[]>`
      INSERT INTO users (username, email, password_hash)
      SELECT ${data.username}, ${data.email}, ${passwordHash}
      WHERE NOT EXISTS (
        SELECT 1 FROM users WHERE lower(username) = lower(${data.username}) OR email = ${data.email}
      )
      RETURNING id, username
    `;
    if (!user) throw new Error('Username or email already registered');

    const session = await getAppSession();
    await session.update(user);
    return user;
  });

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await getAppSession();
  await session.clear();
  return { ok: true };
});

// ============================================================================
// Feed
// ============================================================================

interface FeedRow {
  entryId: string;
  entryCreatedAt: Date;
  repostedBy: string | null;
  id: string;
  content: string | null;
  createdAt: Date;
  likesCount: number;
  retweetsCount: number;
  repliesCount: number;
  isLiked: boolean;
  isRetweeted: boolean;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
}

const cursorSchema = z.object({ createdAt: z.iso.datetime(), id: z.uuid() });

/**
 * Global timeline of top-level posts with cursor pagination on (created_at, id).
 * A pure retweet is returned as the original post with `repostedBy` set.
 */
export const getFeedFn = createServerFn({ method: 'GET' })
  .validator(z.string().nullable())
  .handler(async ({ data: rawCursor }): Promise<FeedPage> => {
    const viewer = await getSessionUser();
    const cursor = rawCursor
      ? cursorSchema.parse(JSON.parse(Buffer.from(rawCursor, 'base64url').toString()))
      : null;

    const rows = await sql<FeedRow[]>`
      SELECT
        e.id AS entry_id,
        e.created_at AS entry_created_at,
        CASE WHEN e.is_retweet THEN eu.username END AS reposted_by,
        p.id, p.content, p.created_at, p.likes_count, p.retweets_count, p.replies_count,
        u.id AS user_id, u.username, u.display_name, u.avatar_url, u.is_verified,
        EXISTS (
          SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ${viewer?.id ?? null}::uuid
        ) AS is_liked,
        EXISTS (
          SELECT 1 FROM posts r
          WHERE r.original_post_id = p.id AND r.is_retweet
            AND r.user_id = ${viewer?.id ?? null}::uuid AND NOT r.is_deleted
        ) AS is_retweeted
      FROM posts e
      JOIN users eu ON eu.id = e.user_id
      JOIN posts p ON p.id = CASE WHEN e.is_retweet THEN e.original_post_id ELSE e.id END
      JOIN users u ON u.id = p.user_id
      WHERE NOT e.is_deleted AND NOT p.is_deleted AND e.parent_id IS NULL
        ${cursor ? sql`AND (e.created_at, e.id) < (${cursor.createdAt}::timestamptz, ${cursor.id}::uuid)` : sql``}
      ORDER BY e.created_at DESC, e.id DESC
      LIMIT ${PAGE_SIZE + 1}
    `;

    const page = rows.slice(0, PAGE_SIZE);
    const last = page.at(-1);
    return {
      posts: page.map(toPostPublic),
      nextCursor:
        rows.length > PAGE_SIZE && last
          ? Buffer.from(
              JSON.stringify({ createdAt: last.entryCreatedAt.toISOString(), id: last.entryId })
            ).toString('base64url')
          : null,
    };
  });

function toPostPublic(row: FeedRow): PostPublic {
  return {
    entryId: row.entryId,
    id: row.id,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    likesCount: row.likesCount,
    retweetsCount: row.retweetsCount,
    repliesCount: row.repliesCount,
    isLiked: row.isLiked,
    isRetweeted: row.isRetweeted,
    repostedBy: row.repostedBy,
    user: {
      id: row.userId,
      username: row.username,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
      isVerified: row.isVerified,
    },
  };
}

// ============================================================================
// Posts & engagement
// ============================================================================

export const createPostFn = createServerFn({ method: 'POST' })
  .validator(postCreateSchema)
  .handler(async ({ data }) => {
    const user = await requireSessionUser();
    const [post] = await sql<{ id: string }[]>`
      INSERT INTO posts (user_id, content) VALUES (${user.id}, ${data.content}) RETURNING id
    `;
    return { id: post!.id };
  });

export const likePostFn = createServerFn({ method: 'POST' })
  .validator(postIdSchema)
  .handler(async ({ data: postId }) => {
    const user = await requireSessionUser();
    await sql.begin(async (tx) => {
      const inserted = await tx<{ ownerId: string }[]>`
        WITH ins AS (
          INSERT INTO likes (user_id, post_id) VALUES (${user.id}, ${postId})
          ON CONFLICT ON CONSTRAINT unique_like DO NOTHING
          RETURNING post_id
        )
        SELECT p.user_id AS owner_id FROM ins JOIN posts p ON p.id = ins.post_id
      `;
      const ownerId = inserted[0]?.ownerId;
      if (ownerId && ownerId !== user.id) {
        await tx`
          INSERT INTO notifications (user_id, actor_id, type, post_id)
          VALUES (${ownerId}, ${user.id}, 'LIKE', ${postId})
        `;
      }
    });
    return { liked: true };
  });

export const unlikePostFn = createServerFn({ method: 'POST' })
  .validator(postIdSchema)
  .handler(async ({ data: postId }) => {
    const user = await requireSessionUser();
    await sql`DELETE FROM likes WHERE user_id = ${user.id} AND post_id = ${postId}`;
    return { liked: false };
  });

/** Toggle a pure retweet of the post for the current user. */
export const retweetPostFn = createServerFn({ method: 'POST' })
  .validator(postIdSchema)
  .handler(async ({ data: postId }) => {
    const user = await requireSessionUser();
    return sql.begin(async (tx) => {
      const removed = await tx`
        DELETE FROM posts WHERE user_id = ${user.id} AND original_post_id = ${postId} AND is_retweet
      `;
      if (removed.count > 0) return { retweeted: false };

      const [post] = await tx<{ userId: string }[]>`
        SELECT user_id FROM posts WHERE id = ${postId} AND NOT is_deleted
      `;
      if (!post) throw new Error('Post not found');
      await tx`INSERT INTO posts (user_id, original_post_id) VALUES (${user.id}, ${postId})`;
      if (post.userId !== user.id) {
        await tx`
          INSERT INTO notifications (user_id, actor_id, type, post_id)
          VALUES (${post.userId}, ${user.id}, 'RETWEET', ${postId})
        `;
      }
      return { retweeted: true };
    });
  });

// ============================================================================
// Notifications
// ============================================================================

export const getNotificationsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getSessionUser();
  if (!user) return { unreadCount: 0 };
  const [row] = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count FROM notifications WHERE user_id = ${user.id} AND NOT is_read
  `;
  return { unreadCount: row?.count ?? 0 };
});
