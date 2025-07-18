import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:block w-48 bg-gray-200 p-4">Menu</aside>
      <div className="flex-1 flex flex-col">
        <header className="bg-gray-100 border-b p-4 font-bold">Dashboard</header>
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
