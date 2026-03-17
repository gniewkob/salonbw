import Link from 'next/link';
import { useRouter } from 'next/router';

const ITEMS = [
    {
        href: '/settings/extra-fields',
        label: 'Klienci',
        iconClass: 'sprite-settings_extra_fields',
    },
    {
        href: '/settings/customer_groups',
        label: 'Grupy klientów',
        iconClass: 'sprite-settings_customer_groups',
    },
    {
        href: '/settings/customer-origins',
        label: 'Pochodzenie klientów',
        iconClass: 'sprite-settings_customer_origins',
    },
    {
        href: '/settings/data-protection',
        label: 'Tryb ochrony danych',
        iconClass: 'sprite-settings_data_protection',
    },
    {
        href: '/settings/card_numbering',
        label: 'Numeracja kart',
        iconClass: 'sprite-customer_card',
    },
] as const;

export default function CustomerSettingsNav() {
    const router = useRouter();

    return (
        <div className="column_row tree other_settings">
            <h4>Klienci</h4>
            <ul>
                {ITEMS.map((item) => {
                    const active =
                        router.pathname === item.href ||
                        router.pathname.startsWith(`${item.href}/`);
                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={active ? 'active' : ''}
                            >
                                <div className="icon_box">
                                    <span
                                        className={`icon ${item.iconClass}`}
                                    />
                                </div>
                                {item.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
