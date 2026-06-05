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
        href: '/calendar?view=employee' as Route,
        label: 'Kalendarz pracownika',
        testId: 'nav-employee-calendar',
    },
    {
        href: '/appointments',
        label: 'Wizyty',
        testId: 'nav-appointments',
    },
    { href: '/customers', label: 'Klienci', testId: 'nav-customers' },
    {
        href: '/settings/employees',
        label: 'Pracownicy',
        testId: 'nav-employees',
    },
    { href: '/services', label: 'Usługi', testId: 'nav-services' },
    { href: '/products', label: 'Produkty', testId: 'nav-products' },
    {
        href: '/settings/timetable/employees',
        label: 'Grafiki',
        testId: 'nav-timetables',
    },
    {
        href: '/communication',
        label: 'Komunikacja',
        testId: 'nav-communications',
    },
    { href: '/statistics', label: 'Statystyki', testId: 'nav-statistics' },
    { href: '/reviews', label: 'Opinie', testId: 'nav-reviews' },
    {
        href: '/settings/branch',
        label: 'Ustawienia firmy',
        testId: 'nav-settings-company',
    },
    {
        href: '/settings/calendar',
        label: 'Ustawienia kalendarza',
        testId: 'nav-settings-calendar',
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
