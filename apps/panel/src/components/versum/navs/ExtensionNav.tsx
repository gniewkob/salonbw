import Link from 'next/link';
import { useRouter } from 'next/router';

type NavItem = {
    id: string;
    label: string;
    href: string;
};

const EXTENSION_ITEMS: NavItem[] = [
    {
        id: 'gift-cards',
        label: 'Bony i Karnety',
        href: '/admin/gift-cards',
    },
];

export default function ExtensionNav() {
    const router = useRouter();

    const isActive = (href: string) =>
        router.pathname === href || router.pathname.startsWith(`${href}/`);

    return (
        <div className="sidebar-inner nav-scroll-container">
            <div className="nav-header">DODATKI</div>
            <ul className="nav nav-list">
                {EXTENSION_ITEMS.map((item) => (
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
