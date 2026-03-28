import { useRouter } from 'next/router';
import SalonListNav from './SalonListNav';

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
        <SalonListNav
            heading="DODATKI"
            items={EXTENSION_ITEMS.map((item) => ({
                ...item,
                active: isActive(item.href),
            }))}
        />
    );
}
