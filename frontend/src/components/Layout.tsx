'use client';
import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import PublicNav from './PublicNav';
import DashboardNav from './DashboardNav';

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isPublicPage =
    router.pathname === '/' ||
    router.pathname.startsWith('/services') ||
    router.pathname.startsWith('/gallery') ||
    router.pathname.startsWith('/contact') ||
    router.pathname.startsWith('/faq') ||
    router.pathname.startsWith('/policy') ||
    router.pathname.startsWith('/privacy') ||
    router.pathname.startsWith('/auth');

  return (
    <div className="min-h-screen flex flex-col">
      {isPublicPage && <PublicNav />}
      <div className="flex flex-1">
        {!isPublicPage && (
          <aside>
            <DashboardNav />
          </aside>
        )}
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
