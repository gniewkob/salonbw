import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function DashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    const stored = localStorage.getItem('role');
    const role =
      stored === 'client' || stored === 'employee' || stored === 'admin'
        ? stored
        : 'client';
    router.replace(`/dashboard/${role}`);
  }, [router]);
  return null;
}
