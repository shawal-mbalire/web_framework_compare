import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { feedQueryOptions } from '~/lib/queries';
import PostCard from './PostCard';

export default function Feed({ loggedIn }: { loggedIn: boolean }) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage, isError } =
    useInfiniteQuery(feedQueryOptions);

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  // Infinite scroll: load the next page when the sentinel scrolls into view
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.entryId} post={post} loggedIn={loggedIn} />
      ))}

      {posts.length === 0 && !isError && (
        <p className="py-8 text-center text-gray-500">No posts yet.</p>
      )}

      {hasNextPage && (
        <div ref={loadMoreRef} className="py-4 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
        </div>
      )}

      {isError && (
        <div className="py-4 text-center text-red-500">Failed to load feed. Please try again.</div>
      )}
    </div>
  );
}
