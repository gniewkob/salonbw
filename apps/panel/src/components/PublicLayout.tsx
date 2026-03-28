'use client';
import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <div className="d-flex flex-column">
            <Navbar />
            <main className="flex-fill p-3">{children}</main>
            <Footer />
        </div>
    );
}
