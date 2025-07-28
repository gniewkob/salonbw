import { useEffect } from 'react';
import { useRouter } from 'next/router';
import type { Role } from '@/types';

export default function DashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    const stored = localStorage.getItem('role');
    const role: Role =
      stored === 'client' || stored === 'employee' || stored === 'admin'
        ? (stored as Role)
        : 'client';
    router.replace(`/dashboard/${role}`);
  }, [router]);
  return null;
}
