import { useRouter } from 'next/router';
import SalonListNav from './SalonListNav';

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
        <SalonListNav
            heading="ŁĄCZNOŚĆ"
            items={COMMUNICATION_ITEMS.map((item) => ({
                ...item,
                active: isActive(item.href),
            }))}
        />
    );
}
