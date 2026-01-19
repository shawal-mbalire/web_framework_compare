import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { getFeedFn } from '~/lib/server';
import PostCard from './PostCard';

export default function Feed() {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const feedQuery = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => getFeedFn(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const posts = feedQuery.data?.pages.flatMap((page) => page.posts) ?? [];

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
          feedQuery.fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [feedQuery]);

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {feedQuery.hasNextPage && (
        <div ref={loadMoreRef} className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}

      {feedQuery.isError && (
        <div className="text-center text-red-500 py-4">
          Failed to load feed. Please try again.
        </div>
      )}
    </div>
  );
}
