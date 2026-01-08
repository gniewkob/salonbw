'use client';
import type { Route } from 'next';
import { useAuth } from '@/contexts/AuthContext';
import SidebarMenu from '../SidebarMenu';

interface Props {
    open?: boolean;
    onClose?: () => void;
}

const links: { href: Route; label: string; testId: string }[] = [
    { href: '/dashboard/employee', label: 'Home', testId: 'nav-home' },
    {
        href: '/appointments',
        label: 'Appointments',
        testId: 'nav-appointments',
    },
    { href: '/clients', label: 'Clients', testId: 'nav-clients' },
];

export default function EmployeeSidebarMenu(props: Props) {
    const { logout } = useAuth();
    return <SidebarMenu {...props} links={links} onLogout={logout} />;
}
