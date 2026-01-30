'use client';
import { ReactNode, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import type { Role } from '@/types';
import Topbar from './Topbar';

interface Props {
    children: ReactNode;
}

interface SidebarProps {
    open?: boolean;
    onClose?: () => void;
}

const ClientSidebar: ComponentType<SidebarProps> =
    process.env.NODE_ENV === 'test'
        ? // eslint-disable-next-line global-require
          (require('./sidebars/ClientSidebarMenu')
              .default as ComponentType<SidebarProps>)
        : dynamic<SidebarProps>(() => import('./sidebars/ClientSidebarMenu'));
const EmployeeSidebar: ComponentType<SidebarProps> =
    process.env.NODE_ENV === 'test'
        ? // eslint-disable-next-line global-require
          (require('./sidebars/EmployeeSidebarMenu')
              .default as ComponentType<SidebarProps>)
        : dynamic<SidebarProps>(() => import('./sidebars/EmployeeSidebarMenu'));
const ReceptionistSidebar: ComponentType<SidebarProps> =
    process.env.NODE_ENV === 'test'
        ? // eslint-disable-next-line global-require
          (require('./sidebars/ReceptionistSidebarMenu')
              .default as ComponentType<SidebarProps>)
        : dynamic<SidebarProps>(
              () => import('./sidebars/ReceptionistSidebarMenu'),
          );
const AdminSidebar: ComponentType<SidebarProps> =
    process.env.NODE_ENV === 'test'
        ? // eslint-disable-next-line global-require
          (require('./sidebars/AdminSidebarMenu')
              .default as ComponentType<SidebarProps>)
        : dynamic<SidebarProps>(() => import('./sidebars/AdminSidebarMenu'));

export default function DashboardLayout({ children }: Props) {
    const [menuOpen, setMenuOpen] = useState(false);
    const { role } = useAuth();

    const SidebarComponent = useMemo(() => {
        const map: Record<Role, ComponentType<SidebarProps>> = {
            client: ClientSidebar,
            employee: EmployeeSidebar,
            receptionist: ReceptionistSidebar,
            admin: AdminSidebar,
        };
        if (
            role === 'client' ||
            role === 'employee' ||
            role === 'receptionist' ||
            role === 'admin'
        ) {
            return map[role];
        }
        return ClientSidebar;
    }, [role]);

    return (
        <div className="min-h-screen bg-brand-gray font-body text-brand-black">
            {/* Navigation Bar (Formerly SidebarComponent) */}
            <SidebarComponent
                open={menuOpen}
                onClose={() => setMenuOpen(!menuOpen)}
            />

            {/* Main Content Area */}
            <main className="pt-20 px-4 md:px-8 pb-8 max-w-7xl mx-auto">
                {/* Topbar removed as it is replaced by the main Navbar */}
                {children}
            </main>
        </div>
    );
}
