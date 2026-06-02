import { useRouter } from 'next/router';
import SalonGroupedNav from './SalonGroupedNav';

type NavItem = {
    id: string;
    label: string;
    href: string;
};

type NavGroup = {
    id: string;
    heading: string;
    items: NavItem[];
};

const SETTINGS_GROUPS: NavGroup[] = [
    {
        id: 'salon',
        heading: 'Salon',
        items: [
            {
                id: 'settings-branch',
                label: 'Dane salonu',
                href: '/settings/branch',
            },
            {
                id: 'settings-hours',
                label: 'Godziny otwarcia',
                href: '/settings/timetable/branch',
            },
            {
                id: 'settings-calendar',
                label: 'Kalendarz',
                href: '/settings/calendar',
            },
            {
                id: 'settings-payments',
                label: 'Płatności',
                href: '/settings/payment-configuration',
            },
        ],
    },
    {
        id: 'employees',
        heading: 'Pracownicy',
        items: [
            {
                id: 'settings-employees',
                label: 'Lista pracowników',
                href: '/settings/employees',
            },
            {
                id: 'settings-schedules',
                label: 'Grafiki pracy',
                href: '/settings/timetable/employees',
            },
            {
                id: 'settings-schedule-templates',
                label: 'Szablony grafików',
                href: '/settings/timetable/templates',
            },
        ],
    },
    {
        id: 'customers',
        heading: 'Klienci',
        items: [
            {
                id: 'settings-extra-fields',
                label: 'Pola dodatkowe',
                href: '/settings/extra-fields',
            },
            {
                id: 'settings-customer-groups',
                label: 'Grupy klientów',
                href: '/settings/customer_groups',
            },
            {
                id: 'settings-customer-origins',
                label: 'Pochodzenie klientów',
                href: '/settings/customer-origins',
            },
            {
                id: 'settings-customer-panel',
                label: 'Rezerwacja online',
                href: '/settings/customer-panel',
            },
        ],
    },
    {
        id: 'communication',
        heading: 'Komunikacja',
        items: [
            { id: 'settings-sms', label: 'SMS', href: '/settings/sms' },
            {
                id: 'settings-reminders',
                label: 'Przypomnienia',
                href: '/settings/reminders',
            },
        ],
    },
    {
        id: 'rodo',
        heading: 'RODO i prywatność',
        items: [
            {
                id: 'settings-data-protection',
                label: 'Ochrona danych',
                href: '/settings/data-protection',
            },
            {
                id: 'settings-data-logs',
                label: 'Logi RODO',
                href: '/settings/data-protection/logs',
            },
            {
                id: 'settings-privacy',
                label: 'Polityka prywatności',
                href: '/settings/privacy',
            },
        ],
    },
    {
        id: 'other',
        heading: 'Inne',
        items: [
            {
                id: 'settings-categories',
                label: 'Kategorie',
                href: '/settings/categories',
            },
            {
                id: 'settings-reviews',
                label: 'Komentarze klientów',
                href: '/reviews',
            },
        ],
    },
];

export default function SettingsNav() {
    const router = useRouter();

    const isActive = (href: string) =>
        router.pathname === href || router.pathname.startsWith(`${href}/`);

    return (
        <SalonGroupedNav
            heading="USTAWIENIA"
            groups={SETTINGS_GROUPS.map((group) => ({
                ...group,
                items: group.items.map((item) => ({
                    ...item,
                    active: isActive(item.href),
                })),
            }))}
        />
    );
}
