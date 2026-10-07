/**
 * API models (snake_case, as returned by server/index.ts)
 */

export interface User {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
}

export interface Post {
  /** Unique per feed entry: a post and a retweet of it can both appear */
  entry_id: string;
  id: string;
  content: string | null;
  user: User;
  created_at: string;
  likes_count: number;
  retweets_count: number;
  replies_count: number;
  is_liked: boolean;
  is_retweeted: boolean;
  /** Username of the reposter when this entry is a pure retweet */
  reposted_by: string | null;
}

export interface FeedResponse {
  posts: Post[];
  next_cursor: string | null;
}

export type NotificationType = 'LIKE' | 'RETWEET' | 'QUOTE_TWEET' | 'REPLY' | 'FOLLOW' | 'MENTION';

export interface Notification {
  id: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  actor: Pick<User, 'username' | 'display_name'>;
  post_id: string | null;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
}
