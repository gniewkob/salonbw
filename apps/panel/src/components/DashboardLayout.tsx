'use client';
import { ReactNode, useState } from 'react';
import type { ComponentType } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import type { Role } from '@/types';
import Topbar from './Topbar';
import SalonShell from '@/components/salon/SalonShell';

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

    if (role === 'admin' || role === 'employee' || role === 'receptionist') {
        return <SalonShell role={role}>{children}</SalonShell>;
    }

    const map: Record<Role, ComponentType<SidebarProps>> = {
        client: ClientSidebar,
        employee: EmployeeSidebar,
        receptionist: ReceptionistSidebar,
        admin: AdminSidebar,
    };
    const SidebarComponent =
        role && role in map ? map[role as Role] : ClientSidebar;

    return (
        <div className="d-flex bg-light">
            <SidebarComponent
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
            />
            <div className="d-flex flex-column flex-fill">
                <Topbar onMenu={() => setMenuOpen(true)} />
                <main className="flex-fill overflow-y-auto p-3">
                    {children}
                </main>
            </div>
        </div>
    );
}
