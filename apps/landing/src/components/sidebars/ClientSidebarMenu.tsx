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
    {
        href: '/appointments',
        label: 'Moje wizyty',
        testId: 'nav-appointments',
    },
    { href: '/invoices', label: 'Faktury', testId: 'nav-invoices' },
    { href: '/reviews', label: 'Opinie', testId: 'nav-reviews' },
];

export default function ClientSidebarMenu(props: Props) {
    const { logout } = useAuth();
    return <SidebarMenu {...props} links={links} onLogout={logout} />;
}
