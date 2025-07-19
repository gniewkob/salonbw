import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function DashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    const role = localStorage.getItem('role') || 'client';
    router.replace(`/dashboard/${role}`);
  }, [router]);
  return null;
}
