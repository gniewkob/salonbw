'use client';
import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import PublicLayout from './PublicLayout';
import DashboardLayout from './DashboardLayout';
import { publicRoutes } from '@/config/publicRoutes';

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isPublicPage = publicRoutes.some((route) =>
    route === '/' ? router.pathname === '/' : router.pathname.startsWith(route)
  );
  return isPublicPage ? (
    <PublicLayout>{children}</PublicLayout>
  ) : (
    <DashboardLayout>{children}</DashboardLayout>
  );
}
