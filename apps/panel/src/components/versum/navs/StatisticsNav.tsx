import { useRouter } from 'next/router';
import Link from 'next/link';

interface NavItem {
    id: string;
    label: string;
    href: string;
    children?: NavItem[];
}

const REPORTS: NavItem[] = [
    { id: 'financial', label: 'Raport finansowy', href: '/statistics' },
    { id: 'employees', label: 'Pracownicy', href: '/statistics/employees' },
    {
        id: 'commissions',
        label: 'Prowizje pracowników',
        href: '/statistics/commissions',
    },
    { id: 'register', label: 'Stan kasy', href: '/statistics/register' },
    { id: 'tips', label: 'Napiwki', href: '/statistics/tips' },
    { id: 'services', label: 'Usługi', href: '/statistics/services' },
    {
        id: 'clients',
        label: 'Klienci',
        href: '/statistics/clients',
        children: [
            {
                id: 'returning',
                label: 'Powracalność klientów',
                href: '/statistics/clients/returning',
            },
            {
                id: 'origins',
                label: 'Pochodzenie klientów',
                href: '/statistics/clients/origins',
            },
        ],
    },
    {
        id: 'warehouse',
        label: 'Magazyn',
        href: '/statistics/warehouse',
        children: [
            {
                id: 'changes',
                label: 'Raport zmian magazynowych',
                href: '/statistics/warehouse/changes',
            },
            {
                id: 'value',
                label: 'Raport wartości produktów',
                href: '/statistics/warehouse/value',
            },
        ],
    },
    {
        id: 'worktime',
        label: 'Raport czasu pracy',
        href: '/statistics/worktime',
    },
    {
        id: 'comments',
        label: 'Komentarze',
        href: '/statistics/comments',
        children: [
            {
                id: 'booksy',
                label: 'Booksy',
                href: '/statistics/comments/booksy',
            },
            {
                id: 'moment',
                label: 'Moment',
                href: '/statistics/comments/moment',
            },
        ],
    },
];

export default function StatisticsNav() {
    const router = useRouter();

    const isActive = (href: string) => {
        return (
            router.pathname === href || router.pathname.startsWith(href + '/')
        );
    };

    return (
        <div className="sidebar-inner nav-scroll-container">
            <div className="nav-header">RAPORTY</div>
            <ul className="nav nav-list">
                {REPORTS.map((item) => (
                    <li key={item.id}>
                        <Link
                            href={item.href}
                            className={isActive(item.href) ? 'active' : ''}
                        >
                            {item.label}
                        </Link>
                        {item.children && (
                            <ul className="nav nav-list sub-nav">
                                {item.children.map((child) => (
                                    <li key={child.id}>
                                        <Link
                                            href={child.href}
                                            className={
                                                isActive(child.href)
                                                    ? 'active'
                                                    : ''
                                            }
                                        >
                                            {child.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
