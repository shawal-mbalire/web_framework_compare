import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUserFn, getNotificationsFn } from '~/lib/server';

export default function Header() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUserFn(),
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotificationsFn(),
    enabled: !!user,
  });

  const unreadCount = notifications?.unreadCount || 0;

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          Social Audit
        </Link>
        
        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <button className="relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              <span className="font-semibold">@{user.username}</span>
            </>
          ) : (
            <Link to="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
