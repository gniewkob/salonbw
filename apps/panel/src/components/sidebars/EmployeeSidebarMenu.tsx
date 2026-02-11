'use client';
import type { Route } from 'next';
import { useAuth } from '@/contexts/AuthContext';
import SidebarMenu from '../SidebarMenu';

interface Props {
    open?: boolean;
    onClose?: () => void;
}

const links: { href: Route; label: string; testId: string }[] = [
    { href: '/dashboard', label: 'Pulpit', testId: 'nav-home' },
    { href: '/calendar', label: 'Kalendarz', testId: 'nav-calendar' },
    {
        href: '/appointments',
        label: 'Moje wizyty',
        testId: 'nav-appointments',
    },
    { href: '/customers', label: 'Klienci', testId: 'nav-clients' },
];

export default function EmployeeSidebarMenu(props: Props) {
    const { logout } = useAuth();
    return <SidebarMenu {...props} links={links} onLogout={logout} />;
}
