import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardNav() {
  const { logout } = useAuth();
  return (
    <aside className="w-48 bg-gray-200 p-4 space-y-2">
      <h2 className="font-bold mb-2">Menu</h2>
      <nav className="space-y-1">
        <Link href="/dashboard">Home</Link>
        <Link href="/dashboard/services">Services</Link>
        <button className="block text-left" onClick={logout}>
          Logout
        </button>
      </nav>
    </aside>
  );
}
