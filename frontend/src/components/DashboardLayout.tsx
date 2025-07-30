'use client';
import { ReactNode, useState } from 'react';
import SidebarMenu from './SidebarMenu';
import Topbar from './Topbar';

interface Props {
    children: ReactNode;
}

export default function DashboardLayout({ children }: Props) {
    const [menuOpen, setMenuOpen] = useState(false);
    return (
        <div className="flex min-h-screen bg-gray-100">
            <SidebarMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
            <div className="flex flex-col flex-1">
                <Topbar onMenu={() => setMenuOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4">{children}</main>
            </div>
        </div>
    );
}
