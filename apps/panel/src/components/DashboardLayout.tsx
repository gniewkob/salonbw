'use client';
import { ReactNode, useState } from 'react';
import type { ComponentType } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import type { Role } from '@/types';
import Topbar from './Topbar';
import VersumShell from '@/components/versum/VersumShell';

interface Props {
    children: ReactNode;
    // pageTitle removed
    secondaryNav?: ReactNode;
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

export default function DashboardLayout({ children, secondaryNav }: Props) {
    const [menuOpen, setMenuOpen] = useState(false);
    const { role } = useAuth();

    if (role === 'admin' || role === 'employee' || role === 'receptionist') {
        return (
            <VersumShell role={role} secondaryNav={secondaryNav}>
                {children}
            </VersumShell>
        );
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
        <div className="flex min-h-screen bg-gray-100">
            <SidebarComponent
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
            />
            <div className="flex flex-col flex-1">
                <Topbar onMenu={() => setMenuOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4">{children}</main>
            </div>
        </div>
    );
}
