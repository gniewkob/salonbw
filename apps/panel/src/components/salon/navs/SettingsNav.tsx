import Link from 'next/link';
import { useRouter } from 'next/router';

type NavItem = {
    href: string;
    label: string;
    matchPrefix?: string;
};

type NavGroup = {
    heading: string;
    items: NavItem[];
};

const GROUPS: NavGroup[] = [
    {
        heading: 'Salon',
        items: [
            { href: '/settings/branch', label: 'Dane salonu' },
            {
                href: '/settings/timetable/branch',
                label: 'Godziny otwarcia',
            },
        ],
    },
    {
        heading: 'Pracownicy',
        items: [
            {
                href: '/employees',
                label: 'Pracownicy',
                matchPrefix: '/employees',
            },
            {
                href: '/settings/timetable/employees',
                label: 'Grafiki pracy',
                matchPrefix: '/settings/timetable',
            },
        ],
    },
    {
        heading: 'Wizyty',
        items: [{ href: '/settings/calendar', label: 'Kalendarz' }],
    },
    {
        heading: 'Komunikacja',
        items: [
            {
                href: '/event-reminders',
                label: 'Komunikacja z klientem',
                matchPrefix: '/event-reminders',
            },
            { href: '/settings/sms', label: 'SMS i łączność' },
        ],
    },
    {
        heading: 'Finanse',
        items: [
            {
                href: '/settings/payment-configuration',
                label: 'Płatności',
            },
        ],
    },
];

export default function SettingsNav() {
    const router = useRouter();

    const isActive = (href: string, matchPrefix?: string) => {
        const prefix = matchPrefix ?? href;
        return (
            router.pathname === href ||
            router.pathname.startsWith(`${prefix}/`)
        );
    };

    return (
        <div className="column_row">
            <div className="nav-header">USTAWIENIA</div>
            <ul className="nav nav-list">
                <li>
                    <Link
                        href="/settings"
                        className={
                            router.pathname === '/settings' ? 'active' : ''
                        }
                        title="Wszystkie ustawienia"
                    >
                        Wszystkie ustawienia
                    </Link>
                </li>
            </ul>
            {GROUPS.map((group) => (
                <div key={group.heading}>
                    <div className="nav-header">{group.heading}</div>
                    <ul className="nav nav-list">
                        {group.items.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={
                                        isActive(item.href, item.matchPrefix)
                                            ? 'active'
                                            : ''
                                    }
                                    title={item.label}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}
