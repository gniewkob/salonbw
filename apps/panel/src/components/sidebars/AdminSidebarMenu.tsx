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
        label: 'Wizyty',
        testId: 'nav-appointments',
    },
    { href: '/clients', label: 'Klienci', testId: 'nav-clients' },
    { href: '/employees', label: 'Pracownicy', testId: 'nav-employees' },
    {
        href: '/admin/services' as Route,
        label: 'Usługi',
        testId: 'nav-services',
    },
    { href: '/products', label: 'Produkty', testId: 'nav-products' },
    {
        href: '/admin/warehouse' as Route,
        label: 'Magazyn',
        testId: 'nav-warehouse',
    },
    {
        href: '/admin/timetables' as Route,
        label: 'Grafiki',
        testId: 'nav-timetables',
    },
    {
        href: '/admin/communications' as Route,
        label: 'Komunikacja',
        testId: 'nav-communications',
    },
    {
        href: '/admin/statistics' as Route,
        label: 'Statystyki',
        testId: 'nav-statistics',
    },
    { href: '/invoices', label: 'Faktury', testId: 'nav-invoices' },
    { href: '/reviews', label: 'Opinie', testId: 'nav-reviews' },
    {
        href: '/admin/settings/company' as Route,
        label: 'Ustawienia firmy',
        testId: 'nav-settings-company',
    },
    {
        href: '/admin/settings/calendar' as Route,
        label: 'Ustawienia kalendarza',
        testId: 'nav-settings-calendar',
    },
    {
        href: '/admin/branches' as Route,
        label: 'Salony (Multi-location)',
        testId: 'nav-branches',
    },
    {
        href: '/admin/gift-cards' as Route,
        label: 'Karty podarunkowe',
        testId: 'nav-gift-cards',
    },
    {
        href: '/admin/loyalty' as Route,
        label: 'Program lojalnościowy',
        testId: 'nav-loyalty',
    },
];

export default function AdminSidebarMenu(props: Props) {
    const { logout } = useAuth();
    return <SidebarMenu {...props} links={links} onLogout={logout} />;
}
