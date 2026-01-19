'use client';
import type { Route } from 'next';
import { useAuth } from '@/contexts/AuthContext';
import SidebarMenu from '../SidebarMenu';

interface Props {
    open?: boolean;
    onClose?: () => void;
}

const links: { href: Route; label: string; testId: string }[] = [
    { href: '/dashboard/admin', label: 'Home', testId: 'nav-home' },
    {
        href: '/appointments',
        label: 'Appointments',
        testId: 'nav-appointments',
    },
    { href: '/clients', label: 'Clients', testId: 'nav-clients' },
    { href: '/employees', label: 'Employees', testId: 'nav-employees' },
    { href: '/dashboard/services', label: 'Services', testId: 'nav-services' },
    { href: '/products', label: 'Products', testId: 'nav-products' },
    { href: '/emails', label: 'Emails', testId: 'nav-emails' },
];

export default function AdminSidebarMenu(props: Props) {
    const { logout } = useAuth();
    return <SidebarMenu {...props} links={links} onLogout={logout} />;
}
