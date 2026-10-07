/**
 * Optimistic cache helpers shared by islands.
 */
import type { InfiniteData, QueryClient } from '@tanstack/svelte-query';
import type { FeedPage, PostPublic } from './schemas';

export const FEED_KEY = ['feed'] as const;

/** Apply `update` to every feed entry that shows post `postId`. */
export function patchPost(
  queryClient: QueryClient,
  postId: string,
  update: (post: PostPublic) => PostPublic
): void {
  queryClient.setQueryData<InfiniteData<FeedPage>>(FEED_KEY, (old) =>
    old
      ? {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) => (p.id === postId ? update(p) : p)),
          })),
        }
      : old
  );
}
