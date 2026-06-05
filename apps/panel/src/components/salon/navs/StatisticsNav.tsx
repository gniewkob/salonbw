import Link from 'next/link';
import { useRouter } from 'next/router';

interface NavItem {
    id: string;
    label: string;
    href: string;
    children?: NavItem[];
}

const GROUPS: Array<{ heading: string; items: NavItem[] }> = [
    {
        heading: 'FINANSE',
        items: [
            { id: 'financial', label: 'Raport finansowy', href: '/statistics' },
            { id: 'register', label: 'Stan kasy', href: '/statistics/register' },
            { id: 'commissions', label: 'Prowizje', href: '/statistics/commissions' },
            { id: 'tips', label: 'Napiwki', href: '/statistics/tips' },
        ],
    },
    {
        heading: 'PRACOWNICY',
        items: [
            { id: 'employees', label: 'Pracownicy', href: '/statistics/employees' },
            { id: 'worktime', label: 'Czas pracy', href: '/statistics/worktime' },
        ],
    },
    {
        heading: 'USŁUGI I KLIENCI',
        items: [
            { id: 'services', label: 'Usługi', href: '/statistics/services' },
            {
                id: 'customers',
                label: 'Klienci',
                href: '/statistics/customers',
                children: [
                    { id: 'returning', label: 'Powracalność', href: '/statistics/customers/returning' },
                    { id: 'origins', label: 'Pochodzenie', href: '/statistics/customers/origins' },
                ],
            },
        ],
    },
    {
        heading: 'MAGAZYN',
        items: [
            {
                id: 'warehouse',
                label: 'Magazyn',
                href: '/statistics/warehouse',
                children: [
                    { id: 'changes', label: 'Zmiany magazynowe', href: '/statistics/warehouse/changes' },
                    { id: 'wartość', label: 'Wartość produktów', href: '/statistics/warehouse/value' },
                ],
            },
        ],
    },
    {
        heading: 'CRM I OPINIE',
        items: [
            { id: 'follow-up', label: 'Audyt follow-up', href: '/statistics/follow-up' },
            {
                id: 'comments',
                label: 'Komentarze',
                href: '/statistics/comments',
                children: [
                    { id: 'booksy', label: 'Booksy', href: '/statistics/comments/booksy' },
                    { id: 'moment', label: 'Moment', href: '/statistics/comments/moment' },
                ],
            },
        ],
    },
];

export default function StatisticsNav() {
    const router = useRouter();

    const isActive = (href: string) =>
        router.pathname === href || router.pathname.startsWith(`${href}/`);

    const renderItem = (item: NavItem) => (
        <li key={item.id} className={isActive(item.href) ? 'active' : undefined}>
            <Link href={item.href} title={item.label}>
                {item.label}
            </Link>
            {item.children ? (
                <ul>
                    {item.children.map((child) => (
                        <li key={child.id} className={isActive(child.href) ? 'active' : undefined}>
                            <Link href={child.href} title={child.label}>
                                {child.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : null}
        </li>
    );

    return (
        <>
            {GROUPS.map((group) => (
                <div key={group.heading} className="column_row">
                    <div className="nav-header">{group.heading}</div>
                    <ul className="nav nav-list">
                        {group.items.map(renderItem)}
                    </ul>
                </div>
            ))}
        </>
    );
}
