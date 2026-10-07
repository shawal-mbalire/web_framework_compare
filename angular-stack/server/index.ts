/**
 * JSON API for the Angular SPA, plus static hosting of the production build.
 *
 *   dev:  bun run api        (port 4300; `ng serve` proxies /api here)
 *   prod: bun server/index.ts (port 4200; serves dist/ and /api)
 */
import bcrypt from 'bcryptjs';
import express, { type NextFunction, type Request, type Response } from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import type { Row } from 'postgres';
import { clearSession, HttpError, readSession, requireUser, setSession } from './session';
import { sql } from './db';

const PAGE_SIZE = 20;
const STATIC_DIR = join(import.meta.dir, '..', 'dist', 'social-audit-angular', 'browser');
const port = Number(process.env.PORT ?? (existsSync(STATIC_DIR) ? 4200 : 4300));

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));

type Handler = (req: Request, res: Response) => Promise<unknown>;
/** Express 5 forwards rejected promises to the error handler. */
const route = (fn: Handler) => (req: Request, res: Response) => fn(req, res);

const uuid = z.uuid();
const postIdParam = (req: Request) => uuid.parse(req.params['id']);

// ============================================================================
// Auth
// ============================================================================

const loginSchema = z.object({ username: z.string().trim().min(1), password: z.string().min(1) });
const registerSchema = z.object({
  username: z.string().trim().regex(/^[a-zA-Z0-9_]{3,20}$/, '3-20 letters, numbers or underscores'),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

const publicUser = (u: Row) => ({
  id: u['id'] as string,
  username: u['username'] as string,
  display_name: u['displayName'] as string | null,
  avatar_url: u['avatarUrl'] as string | null,
  is_verified: u['isVerified'] as boolean,
});

app.post('/api/auth/login', route(async (req, res) => {
  const { username, password } = loginSchema.parse(req.body);
  const [user] = await sql`
    SELECT id, username, display_name, avatar_url, is_verified, password_hash FROM users
    WHERE lower(username) = lower(${username}) OR email = lower(${username})
  `;
  const valid = user ? await bcrypt.compare(password, user['passwordHash']).catch(() => false) : false;
  if (!user || !valid) return res.status(401).json({ error: 'Invalid username or password' });

  await setSession(res, { id: user['id'], username: user['username'] });
  return res.json(publicUser(user));
}));

app.post('/api/auth/register', route(async (req, res) => {
  const data = registerSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(data.password, 12);
  const [user] = await sql`
    INSERT INTO users (username, email, password_hash)
    SELECT ${data.username}, ${data.email}, ${passwordHash}
    WHERE NOT EXISTS (
      SELECT 1 FROM users WHERE lower(username) = lower(${data.username}) OR email = ${data.email}
    )
    RETURNING id, username, display_name, avatar_url, is_verified
  `;
  if (!user) return res.status(409).json({ error: 'Username or email already registered' });

  await setSession(res, { id: user['id'], username: user['username'] });
  return res.status(201).json(publicUser(user));
}));

app.post('/api/auth/logout', (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

app.get('/api/auth/me', route(async (req, res) => {
  const session = await readSession(req);
  if (!session) return res.json(null);
  const [user] = await sql`
    SELECT id, username, display_name, avatar_url, is_verified FROM users WHERE id = ${session.id}
  `;
  return res.json(user ? publicUser(user) : null);
}));

// ============================================================================
// Feed (cursor pagination on (created_at, id); retweets resolve to the original)
// ============================================================================

const cursorSchema = z.object({ createdAt: z.iso.datetime(), id: z.uuid() });

app.get('/api/feed', route(async (req, res) => {
  const viewerId = (await readSession(req))?.id ?? null;
  const rawCursor = typeof req.query['cursor'] === 'string' ? req.query['cursor'] : null;
  const cursor = rawCursor
    ? cursorSchema.parse(JSON.parse(Buffer.from(rawCursor, 'base64url').toString()))
    : null;

  const rows = await sql`
    SELECT
      e.id AS entry_id,
      e.created_at AS entry_created_at,
      CASE WHEN e.is_retweet THEN eu.username END AS reposted_by,
      p.id, p.content, p.created_at, p.likes_count, p.retweets_count, p.replies_count,
      u.id AS user_id, u.username, u.display_name, u.avatar_url, u.is_verified,
      EXISTS (SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ${viewerId}::uuid) AS is_liked,
      EXISTS (
        SELECT 1 FROM posts r
        WHERE r.original_post_id = p.id AND r.is_retweet AND r.user_id = ${viewerId}::uuid AND NOT r.is_deleted
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
  res.json({
    posts: page.map((r) => ({
      entry_id: r['entryId'],
      id: r['id'],
      content: r['content'],
      created_at: r['createdAt'].toISOString(),
      likes_count: r['likesCount'],
      retweets_count: r['retweetsCount'],
      replies_count: r['repliesCount'],
      is_liked: r['isLiked'],
      is_retweeted: r['isRetweeted'],
      reposted_by: r['repostedBy'],
      user: publicUser({
        id: r['userId'],
        username: r['username'],
        displayName: r['displayName'],
        avatarUrl: r['avatarUrl'],
        isVerified: r['isVerified'],
      }),
    })),
    next_cursor:
      rows.length > PAGE_SIZE && last
        ? Buffer.from(JSON.stringify({ createdAt: last['entryCreatedAt'].toISOString(), id: last['entryId'] })).toString('base64url')
        : null,
  });
}));

// ============================================================================
// Posts & engagement
// ============================================================================

const postCreateSchema = z.object({ content: z.string().trim().min(1, 'Post cannot be empty').max(280) });

app.post('/api/posts', route(async (req, res) => {
  const user = await requireUser(req);
  const { content } = postCreateSchema.parse(req.body);
  const [post] = await sql`INSERT INTO posts (user_id, content) VALUES (${user.id}, ${content}) RETURNING id`;
  res.status(201).json({ id: post!['id'] });
}));

app.post('/api/posts/:id/like', route(async (req, res) => {
  const user = await requireUser(req);
  const postId = postIdParam(req);
  await sql.begin(async (tx) => {
    const [inserted] = await tx`
      WITH ins AS (
        INSERT INTO likes (user_id, post_id) VALUES (${user.id}, ${postId})
        ON CONFLICT ON CONSTRAINT unique_like DO NOTHING
        RETURNING post_id
      )
      SELECT p.user_id AS owner_id FROM ins JOIN posts p ON p.id = ins.post_id
    `;
    if (inserted && inserted['ownerId'] !== user.id) {
      await tx`
        INSERT INTO notifications (user_id, actor_id, type, post_id)
        VALUES (${inserted['ownerId']}, ${user.id}, 'LIKE', ${postId})
      `;
    }
  });
  res.json({ liked: true });
}));

app.delete('/api/posts/:id/like', route(async (req, res) => {
  const user = await requireUser(req);
  await sql`DELETE FROM likes WHERE user_id = ${user.id} AND post_id = ${postIdParam(req)}`;
  res.json({ liked: false });
}));

app.post('/api/posts/:id/retweet', route(async (req, res) => {
  const user = await requireUser(req);
  const postId = postIdParam(req);
  const result = await sql.begin(async (tx) => {
    const removed = await tx`
      DELETE FROM posts WHERE user_id = ${user.id} AND original_post_id = ${postId} AND is_retweet
    `;
    if (removed.count > 0) return { retweeted: false };

    const [post] = await tx`SELECT user_id FROM posts WHERE id = ${postId} AND NOT is_deleted`;
    if (!post) return null;
    await tx`INSERT INTO posts (user_id, original_post_id) VALUES (${user.id}, ${postId})`;
    if (post['userId'] !== user.id) {
      await tx`
        INSERT INTO notifications (user_id, actor_id, type, post_id)
        VALUES (${post['userId']}, ${user.id}, 'RETWEET', ${postId})
      `;
    }
    return { retweeted: true };
  });
  if (!result) return res.status(404).json({ error: 'Post not found' });
  return res.json(result);
}));

// ============================================================================
// Notifications
// ============================================================================

async function unreadCount(userId: string): Promise<number> {
  const [row] = await sql`
    SELECT count(*)::int AS count FROM notifications WHERE user_id = ${userId} AND NOT is_read
  `;
  return row?.['count'] ?? 0;
}

app.get('/api/notifications', route(async (req, res) => {
  const user = await requireUser(req);
  const rows = await sql`
    SELECT n.id, n.type, n.is_read, n.created_at, n.post_id, a.username, a.display_name
    FROM notifications n JOIN users a ON a.id = n.actor_id
    WHERE n.user_id = ${user.id}
    ORDER BY n.created_at DESC
    LIMIT 50
  `;
  res.json({
    notifications: rows.map((n) => ({
      id: n['id'],
      type: n['type'],
      is_read: n['isRead'],
      created_at: n['createdAt'].toISOString(),
      post_id: n['postId'],
      actor: { username: n['username'], display_name: n['displayName'] },
    })),
    unread_count: await unreadCount(user.id),
  });
}));

app.post('/api/notifications/:id/read', route(async (req, res) => {
  const user = await requireUser(req);
  await sql`
    UPDATE notifications SET is_read = TRUE, read_at = now()
    WHERE id = ${postIdParam(req)} AND user_id = ${user.id}
  `;
  res.json({ ok: true });
}));

/** Server-Sent Events: emits `unread` whenever the unread count changes. */
app.get('/api/notifications/stream', route(async (req, res) => {
  const user = await requireUser(req);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  let last: number | null = null;
  const tick = async () => {
    const count = await unreadCount(user.id).catch(() => last);
    if (count !== last) {
      last = count;
      res.write(`event: unread\ndata: ${JSON.stringify({ unread_count: count })}\n\n`);
    } else {
      res.write(': heartbeat\n\n');
    }
  };
  await tick();
  const timer = setInterval(tick, 15_000);
  req.on('close', () => clearInterval(timer));
}));

// ============================================================================
// Health, static SPA, errors
// ============================================================================

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

if (existsSync(STATIC_DIR)) {
  app.use(express.static(STATIC_DIR, { index: false, maxAge: '1y', immutable: true }));
  // SPA fallback: let the Angular router handle every other GET
  app.get('/{*path}', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(join(STATIC_DIR, 'index.html'));
  });
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof z.ZodError) {
    res.status(400).json({ error: err.issues.map((i) => i.message).join('; ') });
  } else if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
  } else {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Angular stack API listening on http://localhost:${port}`);
});
