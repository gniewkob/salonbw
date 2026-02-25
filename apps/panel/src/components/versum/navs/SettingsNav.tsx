import Link from 'next/link';
import { useRouter } from 'next/router';

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
        href: '/admin/settings/company',
    },
    {
        id: 'settings-calendar',
        label: 'Godziny otwarcia',
        href: '/admin/settings/calendar',
    },
    {
        id: 'settings-timetables',
        label: 'Grafiki pracy',
        href: '/admin/timetables',
    },
    { id: 'settings-employees', label: 'Pracownicy', href: '/employees' },
    { id: 'settings-reviews', label: 'Komentarze', href: '/reviews' },
    {
        id: 'settings-invoices',
        label: 'Faktury i abonament',
        href: '/invoices',
    },
];

export default function SettingsNav() {
    const router = useRouter();

    const isActive = (href: string) =>
        router.pathname === href || router.pathname.startsWith(`${href}/`);

    return (
        <div className="sidebar-inner nav-scroll-container">
            <div className="nav-header">USTAWIENIA</div>
            <ul className="nav nav-list">
                {SETTINGS_ITEMS.map((item) => (
                    <li key={item.id}>
                        <Link
                            href={item.href}
                            className={isActive(item.href) ? 'active' : ''}
                        >
                            {item.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
