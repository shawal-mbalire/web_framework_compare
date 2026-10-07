import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { currentUserQueryOptions, notificationsQueryOptions } from '~/lib/queries';
import { logoutFn } from '~/lib/server';

export default function Header() {
  const queryClient = useQueryClient();
  const logout = useServerFn(logoutFn);
  const { data: user } = useQuery(currentUserQueryOptions);
  const { data: notifications } = useQuery({ ...notificationsQueryOptions, enabled: !!user });
  const unreadCount = notifications?.unreadCount ?? 0;

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  return (
    <header className="sticky top-0 z-10 border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          Social Audit
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="relative" aria-label={`${unreadCount} unread notifications`}>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {unreadCount}
                  </span>
                )}
              </span>
              <span className="font-semibold">@{user.username}</span>
              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                className="text-blue-600 hover:underline"
              >
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" className="text-blue-600 hover:underline">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
