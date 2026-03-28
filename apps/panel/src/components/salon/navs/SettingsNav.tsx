import { useRouter } from 'next/router';
import SalonListNav from './SalonListNav';

type NavItem = {
    id: string;
    label: string;
    href: string;
};

const SETTINGS_ITEMS: NavItem[] = [
    { id: 'settings-main', label: 'Ustawienia', href: '/settings' },
    {
        id: 'settings-company',
        label: 'Dane salonu',
        href: '/settings/branch',
    },
    {
        id: 'settings-calendar',
        label: 'Kalendarz',
        href: '/settings/calendar',
    },
    {
        id: 'settings-timetables',
        label: 'Grafiki pracy',
        href: '/settings/timetable/employees',
    },
    { id: 'settings-employees', label: 'Pracownicy', href: '/employees' },
    { id: 'settings-reviews', label: 'Komentarze', href: '/reviews' },
    {
        id: 'settings-invoices',
        label: 'Faktury i abonament',
        href: '/invoices',
    },
    {
        id: 'settings-reminders',
        label: 'Komunikacja z klientem',
        href: '/event-reminders',
    },
];

export default function SettingsNav() {
    const router = useRouter();

    const isActive = (href: string) =>
        router.pathname === href || router.pathname.startsWith(`${href}/`);

    return (
        <SalonListNav
            heading="USTAWIENIA"
            items={SETTINGS_ITEMS.map((item) => ({
                ...item,
                active: isActive(item.href),
            }))}
        />
    );
}
