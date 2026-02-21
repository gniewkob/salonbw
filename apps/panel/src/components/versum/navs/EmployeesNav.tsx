import Link from 'next/link';
import { useRouter } from 'next/router';

const SETTINGS_ITEMS = [
    { id: 'employees', label: 'pracownicy', href: '/employees' },
    {
        id: 'activity-logs',
        label: 'logi aktywności',
        href: '/settings/employees/activity_logs',
    },
];

export default function EmployeesNav() {
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
