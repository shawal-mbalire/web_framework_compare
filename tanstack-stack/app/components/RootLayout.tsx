import { Outlet } from '@tanstack/react-router';
import Header from './Header';

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Outlet />
    </div>
  );
}
