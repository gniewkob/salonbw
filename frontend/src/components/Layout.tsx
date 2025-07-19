import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import PublicNav from './PublicNav';
import DashboardNav from './DashboardNav';

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const onDashboard = router.pathname.startsWith('/dashboard');
  return (
    <div className="min-h-screen flex flex-col">
      {!onDashboard && <PublicNav />}
      <div className="flex flex-1">
        {onDashboard && <DashboardNav />}
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
