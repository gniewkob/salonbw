import { useRouter } from 'next/router';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Role } from '@/types';

interface Props {
  children: ReactNode;
  roles?: Role[];
}

export default function RouteGuard({ children, roles }: Props) {
  const { isAuthenticated, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
    } else if (roles && role && !roles.includes(role)) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, role, roles, router]);

  if (!isAuthenticated) return null;
  if (roles && role && !roles.includes(role)) return null;
  return <>{children}</>;
}
