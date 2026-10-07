import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { patchPost } from '~/lib/queries';
import type { PostPublic } from '~/lib/schemas';
import { likePostFn, retweetPostFn, unlikePostFn } from '~/lib/server';

const toggleLiked = (p: PostPublic): PostPublic => ({
  ...p,
  isLiked: !p.isLiked,
  likesCount: p.likesCount + (p.isLiked ? -1 : 1),
});

const toggleRetweeted = (p: PostPublic): PostPublic => ({
  ...p,
  isRetweeted: !p.isRetweeted,
  retweetsCount: p.retweetsCount + (p.isRetweeted ? -1 : 1),
});

function formatDate(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 60 / 24)}d`;
}

export default function PostCard({ post, loggedIn }: { post: PostPublic; loggedIn: boolean }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const like = useServerFn(likePostFn);
  const unlike = useServerFn(unlikePostFn);
  const retweet = useServerFn(retweetPostFn);

  // Optimistic: flip the cached post immediately, flip back on error
  const likeMutation = useMutation({
    mutationFn: async (wasLiked: boolean): Promise<{ liked: boolean }> =>
      wasLiked ? unlike({ data: post.id }) : like({ data: post.id }),
    onMutate: () => patchPost(queryClient, post.id, toggleLiked),
    onError: () => patchPost(queryClient, post.id, toggleLiked),
  });

  const retweetMutation = useMutation({
    mutationFn: () => retweet({ data: post.id }),
    onMutate: () => patchPost(queryClient, post.id, toggleRetweeted),
    onError: () => patchPost(queryClient, post.id, toggleRetweeted),
  });

  const guard = (action: () => void) => () =>
    loggedIn ? action() : void navigate({ to: '/login' });

  return (
    <article className="rounded-lg border bg-white p-4 transition-shadow hover:shadow-sm">
      {post.repostedBy && <p className="mb-2 text-sm text-gray-500">↻ @{post.repostedBy} reposted</p>}
      <div className="flex gap-3">
        <img
          src={post.user.avatarUrl || '/avatar.svg'}
          alt={post.user.username}
          width={48}
          height={48}
          className="h-12 w-12 rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{post.user.displayName || post.user.username}</span>
            <span className="text-gray-500">@{post.user.username}</span>
            {post.user.isVerified && (
              <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" aria-label="Verified">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            <time className="text-gray-500" dateTime={post.createdAt} suppressHydrationWarning>
              · {formatDate(post.createdAt)}
            </time>
          </div>

          <p className="mt-1 whitespace-pre-wrap">{post.content}</p>

          <div className="mt-3 flex gap-6 text-gray-500">
            <button
              type="button"
              aria-label="Like"
              aria-pressed={post.isLiked}
              onClick={guard(() => likeMutation.mutate(post.isLiked))}
              className={`flex items-center gap-1 transition-colors hover:text-red-500 ${post.isLiked ? 'text-red-500' : ''}`}
            >
              <svg className="h-5 w-5" fill={post.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{post.likesCount}</span>
            </button>

            <button
              type="button"
              aria-label="Retweet"
              aria-pressed={post.isRetweeted}
              onClick={guard(() => retweetMutation.mutate())}
              className={`flex items-center gap-1 transition-colors hover:text-green-500 ${post.isRetweeted ? 'text-green-500' : ''}`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{post.retweetsCount}</span>
            </button>

            <span className="flex items-center gap-1" aria-label="Replies">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{post.repliesCount}</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
