import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return <div>Dashboard</div>;
}
