/**
 * Post Model (TypeScript interface)
 */

export interface User {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  followers_count: number;
  following_count: number;
}

export interface Post {
  id: string;
  content: string;
  user: User;
  created_at: Date;
  likes_count: number;
  retweets_count: number;
  replies_count: number;
  is_liked?: boolean;
  is_retweeted?: boolean;
  parent_id: string | null;
  original_post_id: string | null;
  original_post?: Post;
}
