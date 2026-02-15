'use client';
import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Skip to content link for accessibility */}
            <a href="#main-content" className="sr-only focus:not-sr-only">
                Przejdź do treści głównej
            </a>
            <Navbar />
            <main id="main-content" className="flex-1 p-4">
                {children}
            </main>
            <Footer />
        </div>
    );
}
