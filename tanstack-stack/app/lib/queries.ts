import { infiniteQueryOptions, queryOptions, type InfiniteData, type QueryClient } from '@tanstack/react-query';
import { getCurrentUserFn, getFeedFn, getNotificationsFn } from './server';
import type { FeedPage, PostPublic } from './schemas';

export const feedQueryOptions = infiniteQueryOptions({
  queryKey: ['feed'],
  queryFn: ({ pageParam }) => getFeedFn({ data: pageParam }),
  initialPageParam: null as string | null,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

export const currentUserQueryOptions = queryOptions({
  queryKey: ['currentUser'],
  queryFn: () => getCurrentUserFn(),
});

export const notificationsQueryOptions = queryOptions({
  queryKey: ['notifications'],
  queryFn: () => getNotificationsFn(),
  refetchInterval: 30_000,
});

/** Apply `update` to every cached feed entry showing post `postId`. */
export function patchPost(
  queryClient: QueryClient,
  postId: string,
  update: (post: PostPublic) => PostPublic
): void {
  queryClient.setQueryData<InfiniteData<FeedPage, string | null>>(feedQueryOptions.queryKey, (old) =>
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
