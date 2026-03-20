import Link from 'next/link';
import { useRouter } from 'next/router';

type NavItem = {
    id: string;
    label: string;
    href: string;
};

const COMMUNICATION_ITEMS: NavItem[] = [
    {
        id: 'inbox',
        label: 'Nieprzeczytane wiadomości',
        href: '/communication',
    },
    {
        id: 'mass',
        label: 'Wiadomości masowe',
        href: '/communication/mass',
    },
    {
        id: 'templates',
        label: 'Szablony wiadomości',
        href: '/communication/templates',
    },
    {
        id: 'reminders',
        label: 'Przypomnienia',
        href: '/communication/reminders',
    },
];

export default function CommunicationNav() {
    const router = useRouter();

    const isActive = (href: string) =>
        router.pathname === href || router.pathname.startsWith(`${href}/`);

    return (
        <div className="sidebar-inner nav-scroll-container">
            <div className="nav-header">ŁĄCZNOŚĆ</div>
            <ul className="nav nav-list">
                {COMMUNICATION_ITEMS.map((item) => (
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
