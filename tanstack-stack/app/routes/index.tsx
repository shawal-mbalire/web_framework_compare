import { createFileRoute, Link } from '@tanstack/react-router';
import Compose from '~/components/Compose';
import Feed from '~/components/Feed';
import { currentUserQueryOptions, feedQueryOptions } from '~/lib/queries';

export const Route = createFileRoute('/')({
  // Runs on the server for the first request: data is streamed with the HTML
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureInfiniteQueryData(feedQueryOptions),
      queryClient.ensureQueryData(currentUserQueryOptions),
    ]),
  component: Home,
});

function Home() {
  const [, user] = Route.useLoaderData();
  return (
    <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-3">
      <aside className="hidden md:block">
        <nav className="space-y-1 rounded-lg border bg-white p-4">
          <Link
            to="/"
            className="block rounded px-4 py-2 hover:bg-gray-100"
            activeProps={{ className: 'bg-blue-50 font-semibold text-blue-600' }}
          >
            Home
          </Link>
          <Link to="/login" className="block rounded px-4 py-2 hover:bg-gray-100">
            Account
          </Link>
        </nav>
      </aside>

      <div className="space-y-4 md:col-span-2">
        {user && <Compose />}
        <Feed loggedIn={Boolean(user)} />
      </div>
    </main>
  );
}
