import Link from 'next/link';
import { useRouter } from 'next/router';

type NavItem = {
    href: string;
    label: string;
    iconClass: string;
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
            {
                href: '/settings/branch',
                label: 'Dane salonu',
                iconClass: 'sprite-settings_branch',
            },
            {
                href: '/settings/timetable/branch',
                label: 'Godziny otwarcia',
                iconClass: 'sprite-schedule_template',
                matchPrefix: '/settings/timetable/branch',
            },
        ],
    },
    {
        heading: 'Pracownicy',
        items: [
            {
                href: '/employees',
                label: 'Pracownicy',
                iconClass: 'sprite-settings_employees',
                matchPrefix: '/employees',
            },
            {
                href: '/settings/timetable/employees',
                label: 'Grafiki pracy',
                iconClass: 'sprite-schedule_employees',
                matchPrefix: '/settings/timetable',
            },
        ],
    },
    {
        heading: 'Wizyty',
        items: [
            {
                href: '/settings/calendar',
                label: 'Kalendarz',
                iconClass: 'sprite-settings_calendar',
            },
            {
                href: '/settings/online-booking',
                label: 'Rezerwacja online',
                iconClass: 'sprite-settings_label_visits',
                matchPrefix: '/settings/online-booking',
            },
        ],
    },
    {
        heading: 'Komunikacja',
        items: [
            {
                href: '/event-reminders',
                label: 'Komunikacja z klientem',
                iconClass: 'sprite-settings_notifications_nav',
                matchPrefix: '/event-reminders',
            },
            {
                href: '/settings/sms',
                label: 'SMS i łączność',
                iconClass: 'sprite-settings_sms_nav',
            },
        ],
    },
    {
        heading: 'Finanse',
        items: [
            {
                href: '/settings/payment-configuration',
                label: 'Płatności',
                iconClass: 'sprite-settings_payment_methods',
            },
            {
                href: '/invoices',
                label: 'Faktury i abonament',
                iconClass: 'sprite-settings_billing',
                matchPrefix: '/invoices',
            },
        ],
    },
    {
        heading: 'Prywatność',
        items: [
            {
                href: '/settings/privacy',
                label: 'Prywatność i zgody',
                iconClass: 'sprite-settings_data_protection',
                matchPrefix: '/settings/privacy',
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
        <div className="column_row tree other_settings">
            <h4>Ustawienia</h4>
            <ul>
                <li>
                    <Link
                        href="/settings"
                        className={
                            router.pathname === '/settings' ? 'active' : ''
                        }
                    >
                        <div className="icon_box">
                            <span
                                className="icon sprite-settings_blue"
                                aria-hidden="true"
                            />
                        </div>
                        Wszystkie ustawienia
                    </Link>
                </li>
            </ul>
            {GROUPS.map((group) => (
                <div key={group.heading}>
                    <h4>{group.heading}</h4>
                    <ul>
                        {group.items.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={
                                        isActive(item.href, item.matchPrefix)
                                            ? 'active'
                                            : ''
                                    }
                                >
                                    <div className="icon_box">
                                        <span
                                            className={`icon ${item.iconClass}`}
                                            aria-hidden="true"
                                        />
                                    </div>
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
