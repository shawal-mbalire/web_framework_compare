/**
 * Feed queries. Cursor pagination on (created_at, id) keeps pages stable
 * while new posts arrive.
 */
import { sql } from './db';
import type { FeedPage, PostPublic } from './schemas';

const PAGE_SIZE = 20;

interface Cursor {
  createdAt: string;
  id: string;
}

function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c)).toString('base64url');
}

function decodeCursor(raw: string | null): Cursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString());
    return typeof parsed.createdAt === 'string' && typeof parsed.id === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

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

/**
 * Global timeline of top-level posts. A pure retweet is returned as the
 * original post with `repostedBy` set, so engagement targets the original.
 */
export async function getFeed(viewerId: string | null, rawCursor: string | null): Promise<FeedPage> {
  const cursor = decodeCursor(rawCursor);
  const rows = await sql<FeedRow[]>`
    SELECT
      e.id AS entry_id,
      e.created_at AS entry_created_at,
      CASE WHEN e.is_retweet THEN eu.username END AS reposted_by,
      p.id, p.content, p.created_at, p.likes_count, p.retweets_count, p.replies_count,
      u.id AS user_id, u.username, u.display_name, u.avatar_url, u.is_verified,
      EXISTS (
        SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ${viewerId}::uuid
      ) AS is_liked,
      EXISTS (
        SELECT 1 FROM posts r
        WHERE r.original_post_id = p.id AND r.is_retweet
          AND r.user_id = ${viewerId}::uuid AND NOT r.is_deleted
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
        ? encodeCursor({ createdAt: last.entryCreatedAt.toISOString(), id: last.entryId })
        : null,
  };
}

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
