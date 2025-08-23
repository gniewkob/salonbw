'use client';
import { ReactNode } from 'react';
import PublicNav from './PublicNav';
import Footer from './Footer';

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col">
            <PublicNav />
            <main className="flex-1 p-4">{children}</main>
            <Footer />
        </div>
    );
}
