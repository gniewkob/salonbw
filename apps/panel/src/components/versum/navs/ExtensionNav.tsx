import Link from 'next/link';
import { useRouter } from 'next/router';

type NavItem = {
    id: string;
    label: string;
    href: string;
};

const EXTENSION_ITEMS: NavItem[] = [
    { id: 'extension-main', label: 'Dodatki', href: '/extension' },
    {
        id: 'extension-marketing',
        label: 'Marketing Automatyczny',
        href: '/extension',
    },
    {
        id: 'extension-loyalty',
        label: 'Program Lojalnościowy',
        href: '/admin/loyalty',
    },
    {
        id: 'extension-gift-cards',
        label: 'Bony i Karnety',
        href: '/admin/gift-cards',
    },
    {
        id: 'extension-fiscalization',
        label: 'Fiskalizacja',
        href: '/extension',
    },
    {
        id: 'extension-google-calendar',
        label: 'Kalendarz Google',
        href: '/extension',
    },
    {
        id: 'extension-access',
        label: 'Ograniczenie Dostępu',
        href: '/extension',
    },
];

export default function ExtensionNav() {
    const router = useRouter();

    const isActive = (href: string, id: string) => {
        if (id === 'extension-main') {
            return router.pathname === '/extension';
        }
        return (
            router.pathname === href || router.pathname.startsWith(`${href}/`)
        );
    };

    return (
        <div className="sidebar-inner nav-scroll-container">
            <div className="nav-header">DODATKI</div>
            <ul className="nav nav-list">
                {EXTENSION_ITEMS.map((item) => (
                    <li key={item.id}>
                        <Link
                            href={item.href}
                            className={
                                isActive(item.href, item.id) ? 'active' : ''
                            }
                        >
                            {item.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
