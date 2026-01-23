'use client';
import type { Route } from 'next';
import { useAuth } from '@/contexts/AuthContext';
import SidebarMenu from '../SidebarMenu';

interface Props {
    open?: boolean;
    onClose?: () => void;
}

const links: { href: Route; label: string; testId: string }[] = [
    { href: '/appointments', label: 'Home', testId: 'nav-home' },
    // TODO: Enable when backend supports these endpoints
    // { href: '/invoices', label: 'Invoices', testId: 'nav-invoices' },
    // { href: '/reviews', label: 'Reviews', testId: 'nav-reviews' },
];

export default function ClientSidebarMenu(props: Props) {
    const { logout } = useAuth();
    return <SidebarMenu {...props} links={links} onLogout={logout} />;
}
