import Link from 'next/link';
import { useRouter } from 'next/router';

interface NavItem {
    id: string;
    label: string;
    href: string;
    title?: string;
    menuItemName?: string;
    children?: NavItem[];
}

const REPORTS: NavItem[] = [
    {
        id: 'financial',
        label: 'Raport finansowy',
        href: '/statistics',
        title: 'Raport finansowy',
    },
    {
        id: 'employees',
        label: 'Pracownicy',
        href: '/statistics/employees',
        title: 'Pracownicy',
    },
    {
        id: 'commissions',
        label: 'Prowizje pracowników',
        href: '/statistics/commissions',
        title: 'Prowizje pracowników',
    },
    {
        id: 'register',
        label: 'Stan kasy',
        href: '/statistics/register',
        title: 'Stan kasy',
    },
    {
        id: 'tips',
        label: 'Napiwki',
        href: '/statistics/tips',
        title: 'Napiwki',
    },
    {
        id: 'services',
        label: 'Usługi',
        href: '/statistics/services',
        title: 'Usługi',
    },
    {
        id: 'customers',
        label: 'Klienci',
        href: '/statistics/customers',
        children: [
            {
                id: 'returning',
                label: 'Powracalność klientów',
                href: '/statistics/customers/returning',
                menuItemName: 'returning_customers',
            },
            {
                id: 'origins',
                label: 'Pochodzenie klientów',
                href: '/statistics/customers/origins',
                menuItemName: 'customer_origins',
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
                menuItemName: 'inventories_history',
            },
            {
                id: 'value',
                label: 'Raport wartości produktów',
                href: '/statistics/warehouse/value',
                menuItemName: 'product_values',
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

    const isActive = (href: string) =>
        router.pathname === href || router.pathname.startsWith(`${href}/`);

    return (
        <div className="sidebar-inner nav-scroll-container column_row tree">
            <ul id="statistics_menu_list">
                {REPORTS.map((item) => (
                    <li
                        key={item.id}
                        className={isActive(item.href) ? 'active' : ''}
                    >
                        <Link
                            href={item.href}
                            className={isActive(item.href) ? 'active' : ''}
                            title={item.title || item.label}
                            data-push="true"
                        >
                            {item.label}
                        </Link>
                        {item.children ? (
                            <ul>
                                {item.children.map((child) => (
                                    <li key={child.id}>
                                        <Link
                                            href={child.href}
                                            className={
                                                isActive(child.href)
                                                    ? 'active'
                                                    : ''
                                            }
                                            data-menu-item-name={
                                                child.menuItemName
                                            }
                                        >
                                            {child.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </li>
                ))}
            </ul>
        </div>
    );
}
