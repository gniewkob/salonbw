'use client';
import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import PublicLayout from './PublicLayout';
import DashboardLayout from './DashboardLayout';
import { publicRoutes } from '@/config/publicRoutes';

export function isPublicPage(pathname: string): boolean {
  return publicRoutes.some((route) =>
    route === '/' ? pathname === '/' : pathname.split('/')[1] === route.slice(1)
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const publicPage = isPublicPage(router.pathname);
  return publicPage ? (
    <PublicLayout>{children}</PublicLayout>
  ) : (
    <DashboardLayout>{children}</DashboardLayout>
  );
}
