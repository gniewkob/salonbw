import Link from 'next/link';
import { useRouter } from 'next/router';

type NavItem = {
    id: string;
    href: string;
    label: string;
    iconClass: string;
    matchPrefix?: string;
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
                href: '/settings/branch',
                label: 'Dane salonu',
                iconClass: 'sprite-settings_branch',
            },
            {
                id: 'settings-hours',
                href: '/settings/timetable/branch',
                label: 'Godziny otwarcia',
                iconClass: 'sprite-schedule_template',
                matchPrefix: '/settings/timetable/branch',
            },
            {
                id: 'settings-calendar',
                href: '/settings/calendar',
                label: 'Kalendarz',
                iconClass: 'sprite-settings_calendar',
            },
            {
                id: 'settings-categories',
                href: '/settings/categories',
                label: 'Kategorie',
                iconClass: 'sprite-settings_blue',
            },
        ],
    },
    {
        id: 'employees',
        heading: 'Pracownicy',
        items: [
            {
                id: 'settings-employees',
                href: '/settings/employees',
                label: 'Lista pracowników',
                iconClass: 'sprite-settings_employees',
                matchPrefix: '/settings/employees',
            },
            {
                id: 'settings-schedules',
                href: '/settings/timetable/employees',
                label: 'Grafiki pracy',
                iconClass: 'sprite-schedule_employees',
                matchPrefix: '/settings/timetable/employees',
            },
            {
                id: 'settings-schedule-templates',
                href: '/settings/timetable/templates',
                label: 'Szablony grafików',
                iconClass: 'sprite-schedule_template',
                matchPrefix: '/settings/timetable/templates',
            },
        ],
    },
    {
        id: 'customers',
        heading: 'Klienci',
        items: [
            {
                id: 'settings-customers',
                href: '/settings/customers',
                label: 'Klienci',
                iconClass: 'sprite-settings_blue',
                matchPrefix: '/settings/customers',
            },
            {
                id: 'settings-online-booking',
                href: '/settings/online-booking',
                label: 'Rezerwacja online',
                iconClass: 'sprite-settings_label_visits',
                matchPrefix: '/settings/online-booking',
            },
        ],
    },
    {
        id: 'communication',
        heading: 'Komunikacja',
        items: [
            {
                id: 'settings-sms',
                href: '/settings/sms',
                label: 'SMS i łączność',
                iconClass: 'sprite-settings_sms_nav',
            },
        ],
    },
    {
        id: 'finance',
        heading: 'Finanse',
        items: [
            {
                id: 'settings-payments',
                href: '/settings/payment-configuration',
                label: 'Płatności',
                iconClass: 'sprite-settings_payment_methods',
            },
        ],
    },
    {
        id: 'privacy',
        heading: 'Prywatność i RODO',
        items: [
            {
                id: 'settings-privacy',
                href: '/settings/privacy',
                label: 'Zgody i prywatność',
                iconClass: 'sprite-settings_data_protection',
                matchPrefix: '/settings/privacy',
            },
            {
                id: 'settings-data-logs',
                href: '/settings/data-protection/logs',
                label: 'Logi RODO',
                iconClass: 'sprite-settings_blue',
                matchPrefix: '/settings/data-protection/logs',
            },
        ],
    },
    {
        id: 'other',
        heading: 'Inne',
        items: [
            {
                id: 'settings-reviews',
                href: '/reviews',
                label: 'Komentarze klientów',
                iconClass: 'sprite-settings_blue',
            },
        ],
    },
];

export default function SettingsNav() {
    const router = useRouter();

    const isActive = (href: string, matchPrefix?: string) => {
        const prefix = matchPrefix ?? href;
        return (
            router.pathname === href || router.pathname.startsWith(`${prefix}/`)
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
            {SETTINGS_GROUPS.map((group) => (
                <div key={group.id}>
                    <h4>{group.heading}</h4>
                    <ul>
                        {group.items.map((item) => (
                            <li key={item.id}>
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
