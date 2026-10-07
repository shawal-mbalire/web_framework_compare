/**
 * Astro Actions: type-safe server mutations callable from islands
 * (`actions.likePost(...)`) and from plain HTML forms (`accept: 'form'`).
 */
import { ActionError, defineAction, type ActionAPIContext } from 'astro:actions';
import { z } from 'astro/zod';
import bcrypt from 'bcryptjs';
import { createSession, destroySession, type SessionUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { loginSchema, postCreateSchema, postIdSchema, registerSchema } from '@/lib/schemas';

function requireUser(context: ActionAPIContext): SessionUser {
  const user = context.locals.user;
  if (!user) {
    throw new ActionError({ code: 'UNAUTHORIZED', message: 'Please log in first' });
  }
  return user;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false; // malformed hash never matches
  }
}

export const server = {
  // ==========================================================================
  // Authentication
  // ==========================================================================

  login: defineAction({
    accept: 'form',
    input: loginSchema,
    handler: async ({ username, password }, context) => {
      const [user] = await sql<{ id: string; username: string; passwordHash: string }[]>`
        SELECT id, username, password_hash FROM users
        WHERE lower(username) = lower(${username}) OR email = lower(${username})
      `;
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        throw new ActionError({ code: 'UNAUTHORIZED', message: 'Invalid username or password' });
      }
      await createSession(context.cookies, { id: user.id, username: user.username });
      return { username: user.username };
    },
  }),

  register: defineAction({
    accept: 'form',
    input: registerSchema,
    handler: async ({ username, email, password }, context) => {
      const passwordHash = await bcrypt.hash(password, 12);
      const [user] = await sql<{ id: string; username: string }[]>`
        INSERT INTO users (username, email, password_hash)
        SELECT ${username}, ${email}, ${passwordHash}
        WHERE NOT EXISTS (
          SELECT 1 FROM users WHERE lower(username) = lower(${username}) OR email = ${email}
        )
        RETURNING id, username
      `;
      if (!user) {
        throw new ActionError({ code: 'CONFLICT', message: 'Username or email already registered' });
      }
      await createSession(context.cookies, user);
      return { username: user.username };
    },
  }),

  logout: defineAction({
    accept: 'form',
    handler: async (_input, context) => {
      destroySession(context.cookies);
      return { ok: true };
    },
  }),

  // ==========================================================================
  // Posts
  // ==========================================================================

  createPost: defineAction({
    input: postCreateSchema,
    handler: async ({ content, parentId }, context) => {
      const user = requireUser(context);
      return sql.begin(async (tx) => {
        let threadFields = { parentId: null as string | null, rootPostId: null as string | null, depth: 0 };
        if (parentId) {
          const [parent] = await tx<
            { id: string; userId: string; rootPostId: string | null; threadDepth: number }[]
          >`SELECT id, user_id, root_post_id, thread_depth FROM posts WHERE id = ${parentId} AND NOT is_deleted`;
          if (!parent) throw new ActionError({ code: 'NOT_FOUND', message: 'Parent post not found' });
          if (parent.threadDepth >= 10) {
            throw new ActionError({ code: 'BAD_REQUEST', message: 'Thread is too deep' });
          }
          threadFields = {
            parentId: parent.id,
            rootPostId: parent.rootPostId ?? parent.id,
            depth: parent.threadDepth + 1,
          };
          if (parent.userId !== user.id) {
            await tx`
              INSERT INTO notifications (user_id, actor_id, type, post_id)
              VALUES (${parent.userId}, ${user.id}, 'REPLY', ${parent.id})
            `;
          }
        }
        const [post] = await tx<{ id: string }[]>`
          INSERT INTO posts (user_id, content, parent_id, root_post_id, thread_depth)
          VALUES (${user.id}, ${content}, ${threadFields.parentId}, ${threadFields.rootPostId}, ${threadFields.depth})
          RETURNING id
        `;
        return { id: post!.id };
      });
    },
  }),

  deletePost: defineAction({
    input: postIdSchema,
    handler: async ({ postId }, context) => {
      const user = requireUser(context);
      // Hard delete so the count triggers in schema.sql stay consistent
      const deleted = await sql`DELETE FROM posts WHERE id = ${postId} AND user_id = ${user.id}`;
      if (deleted.count === 0) throw new ActionError({ code: 'NOT_FOUND', message: 'Post not found' });
      return { deleted: true };
    },
  }),

  likePost: defineAction({
    input: postIdSchema,
    handler: async ({ postId }, context) => {
      const user = requireUser(context);
      return sql.begin(async (tx) => {
        const [post] = await tx<{ userId: string }[]>`SELECT user_id FROM posts WHERE id = ${postId}`;
        if (!post) throw new ActionError({ code: 'NOT_FOUND', message: 'Post not found' });
        const inserted = await tx`
          INSERT INTO likes (user_id, post_id) VALUES (${user.id}, ${postId})
          ON CONFLICT ON CONSTRAINT unique_like DO NOTHING
        `;
        if (inserted.count > 0 && post.userId !== user.id) {
          await tx`
            INSERT INTO notifications (user_id, actor_id, type, post_id)
            VALUES (${post.userId}, ${user.id}, 'LIKE', ${postId})
          `;
        }
        return { liked: true };
      });
    },
  }),

  unlikePost: defineAction({
    input: postIdSchema,
    handler: async ({ postId }, context) => {
      const user = requireUser(context);
      await sql`DELETE FROM likes WHERE user_id = ${user.id} AND post_id = ${postId}`;
      return { liked: false };
    },
  }),

  /** Toggle a pure retweet of `postId` for the current user. */
  retweetPost: defineAction({
    input: postIdSchema,
    handler: async ({ postId }, context) => {
      const user = requireUser(context);
      return sql.begin(async (tx) => {
        const removed = await tx`
          DELETE FROM posts WHERE user_id = ${user.id} AND original_post_id = ${postId} AND is_retweet
        `;
        if (removed.count > 0) return { retweeted: false };

        const [post] = await tx<{ userId: string }[]>`
          SELECT user_id FROM posts WHERE id = ${postId} AND NOT is_deleted
        `;
        if (!post) throw new ActionError({ code: 'NOT_FOUND', message: 'Post not found' });
        await tx`INSERT INTO posts (user_id, original_post_id) VALUES (${user.id}, ${postId})`;
        if (post.userId !== user.id) {
          await tx`
            INSERT INTO notifications (user_id, actor_id, type, post_id)
            VALUES (${post.userId}, ${user.id}, 'RETWEET', ${postId})
          `;
        }
        return { retweeted: true };
      });
    },
  }),

  // ==========================================================================
  // Social graph
  // ==========================================================================

  followUser: defineAction({
    input: z.object({ username: z.string() }),
    handler: async ({ username }, context) => {
      const user = requireUser(context);
      return sql.begin(async (tx) => {
        const [target] = await tx<{ id: string }[]>`
          SELECT id FROM users WHERE lower(username) = lower(${username})
        `;
        if (!target) throw new ActionError({ code: 'NOT_FOUND', message: 'User not found' });
        if (target.id === user.id) {
          throw new ActionError({ code: 'BAD_REQUEST', message: "You can't follow yourself" });
        }
        const inserted = await tx`
          INSERT INTO follows (follower_id, followed_id) VALUES (${user.id}, ${target.id})
          ON CONFLICT ON CONSTRAINT unique_follow DO NOTHING
        `;
        if (inserted.count > 0) {
          await tx`
            INSERT INTO notifications (user_id, actor_id, type) VALUES (${target.id}, ${user.id}, 'FOLLOW')
          `;
        }
        return { following: true };
      });
    },
  }),

  unfollowUser: defineAction({
    input: z.object({ username: z.string() }),
    handler: async ({ username }, context) => {
      const user = requireUser(context);
      await sql`
        DELETE FROM follows
        WHERE follower_id = ${user.id}
          AND followed_id = (SELECT id FROM users WHERE lower(username) = lower(${username}))
      `;
      return { following: false };
    },
  }),

  // ==========================================================================
  // Notifications
  // ==========================================================================

  markNotificationRead: defineAction({
    input: z.object({ notificationId: z.uuid() }),
    handler: async ({ notificationId }, context) => {
      const user = requireUser(context);
      await sql`
        UPDATE notifications SET is_read = TRUE, read_at = now()
        WHERE id = ${notificationId} AND user_id = ${user.id}
      `;
      return { ok: true };
    },
  }),

  markAllNotificationsRead: defineAction({
    handler: async (_input, context) => {
      const user = requireUser(context);
      await sql`
        UPDATE notifications SET is_read = TRUE, read_at = now()
        WHERE user_id = ${user.id} AND NOT is_read
      `;
      return { ok: true };
    },
  }),
};
