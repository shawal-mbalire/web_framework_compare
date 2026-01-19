import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likePostFn, unlikePostFn, retweetPostFn } from '~/lib/server';
import type { PostPublic } from '~/lib/schemas';

interface PostCardProps {
  post: PostPublic;
}

export default function PostCard({ post }: PostCardProps) {
  const queryClient = useQueryClient();

  // Optimistic like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (post.is_liked) {
        return unlikePostFn(post.id);
      } else {
        return likePostFn(post.id);
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });

      const previousData = queryClient.getQueryData(['feed']);

      queryClient.setQueryData(['feed'], (old: any) => ({
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          posts: page.posts.map((p: PostPublic) =>
            p.id === post.id
              ? {
                  ...p,
                  is_liked: !p.is_liked,
                  likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1,
                }
              : p
          ),
        })),
      }));

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['feed'], context.previousData);
      }
    },
  });

  const retweetMutation = useMutation({
    mutationFn: () => retweetPostFn(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / 1000 / 60 / 60);

    if (hours < 1) return 'now';
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="bg-white rounded-lg p-4 border hover:shadow-sm transition-shadow">
      <div className="flex gap-3">
        <img
          src={post.user.avatar_url || 'https://via.placeholder.com/48'}
          alt={post.user.username}
          className="w-12 h-12 rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{post.user.display_name || post.user.username}</span>
            <span className="text-gray-500">@{post.user.username}</span>
            {post.user.is_verified && (
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-gray-500">· {formatDate(post.created_at)}</span>
          </div>

          <p className="mt-1 whitespace-pre-wrap">{post.content}</p>

          {post.media_urls && post.media_urls.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {post.media_urls.map((url, i) => (
                <img key={i} src={url} alt="" className="rounded-lg w-full" />
              ))}
            </div>
          )}

          {/* Engagement buttons */}
          <div className="flex gap-6 mt-3 text-gray-500">
            <button
              onClick={() => likeMutation.mutate()}
              className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                post.is_liked ? 'text-red-500' : ''
              }`}
            >
              <svg className="w-5 h-5" fill={post.is_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{post.likes_count}</span>
            </button>

            <button
              onClick={() => retweetMutation.mutate()}
              className={`flex items-center gap-1 hover:text-green-500 transition-colors ${
                post.is_retweeted ? 'text-green-500' : ''
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{post.retweets_count}</span>
            </button>

            <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{post.replies_count}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
