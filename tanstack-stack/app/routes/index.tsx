import Compose from '~/components/Compose';
import Feed from '~/components/Feed';

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Sidebar */}
      <aside className="hidden md:block">
        <nav className="bg-white rounded-lg p-4 space-y-2">
          <a href="/" className="block px-4 py-2 rounded bg-blue-50 text-blue-600 font-semibold">
            Home
          </a>
          <a href="/explore" className="block px-4 py-2 rounded hover:bg-gray-100">
            Explore
          </a>
          <a href="/notifications" className="block px-4 py-2 rounded hover:bg-gray-100">
            Notifications
          </a>
          <a href="/profile" className="block px-4 py-2 rounded hover:bg-gray-100">
            Profile
          </a>
        </nav>
      </aside>

      {/* Feed */}
      <div className="md:col-span-2 space-y-4">
        <Compose />
        <Feed />
      </div>
    </main>
  );
}
