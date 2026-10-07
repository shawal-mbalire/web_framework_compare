/**
 * Zod schemas and shared types (used by server functions and components).
 */
import { z } from 'zod';

export const POST_MAX_LENGTH = 280;

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_]{3,20}$/, '3-20 letters, numbers or underscores'),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8, 'At least 8 characters').max(100),
});

export const postCreateSchema = z.object({
  content: z.string().trim().min(1, 'Post cannot be empty').max(POST_MAX_LENGTH),
});

export const postIdSchema = z.uuid();

export interface UserPublic {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
}

export interface PostPublic {
  /** Unique per feed entry: a post and a retweet of it can both appear */
  entryId: string;
  id: string;
  content: string | null;
  createdAt: string;
  likesCount: number;
  retweetsCount: number;
  repliesCount: number;
  isLiked: boolean;
  isRetweeted: boolean;
  /** Username of the reposter when this entry is a pure retweet */
  repostedBy: string | null;
  user: UserPublic;
}

export interface FeedPage {
  posts: PostPublic[];
  nextCursor: string | null;
}

export interface SessionUser {
  id: string;
  username: string;
}
