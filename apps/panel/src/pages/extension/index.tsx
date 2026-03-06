import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';

type ExtensionCard = {
    id: string;
    title: string;
    description: string;
    icon: string;
    status: 'Aktywny' | 'Nieaktywny';
};

const cards: ExtensionCard[] = [
    {
        id: 'automatic_marketing',
        title: 'Marketing Automatyczny',
        description:
            'Skorzystaj z nowoczesnych rozwiązań marketingowych, które zwiększą skuteczność.',
        icon: 'automatic_marketing',
        status: 'Aktywny',
    },
    {
        id: 'lumo',
        title: 'Program Lojalnościowy',
        description:
            'Buduj lojalność i zaangażowanie obecnych klientów i przyciągaj do salonu nowe osoby.',
        icon: 'lumo',
        status: 'Nieaktywny',
    },
    {
        id: 'resources',
        title: 'Zasoby',
        description:
            'Automatycznie sprawdza dostępność urządzeń i pomieszczeń podczas wprowadzania wizyt.',
        icon: 'resources',
        status: 'Nieaktywny',
    },
    {
        id: 'gift_cards',
        title: 'Bony i Karnety',
        description:
            'Zaoferuj swoim klientom bony, karty podarunkowe i karnety.',
        icon: 'gift_cards',
        status: 'Nieaktywny',
    },
    {
        id: 'fiscalization',
        title: 'Fiskalizacja',
        description:
            'Włącz funkcję fiskalizacji i drukuj paragony na drukarce fiskalnej.',
        icon: 'fiscalization',
        status: 'Nieaktywny',
    },
    {
        id: 'google_calendar',
        title: 'Kalendarz Google',
        description:
            'Idealne rozwiązanie organizacyjne dla osób pracujących w kilku miejscach.',
        icon: 'google_calendar',
        status: 'Nieaktywny',
    },
    {
        id: 'access_restriction',
        title: 'Ograniczenie Dostępu',
        description:
            'Ogranicz dostęp do systemu dla wybranych godzin, urządzeń lub adresów IP.',
        icon: 'access_restriction',
        status: 'Nieaktywny',
    },
];

export default function ExtensionPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:extension">
            <VersumShell role={role}>
                <div className="versum-page" data-testid="extension-page">
                    <ul className="breadcrumb">
                        <li>Dodatki</li>
                    </ul>
                    <div className="versum-extension-grid">
                        {cards.map((card) => (
                            <Link
                                key={card.id}
                                href={`/extension/tools/${card.id}`}
                                className={`ext-col${card.status === 'Aktywny' ? ' ext_active' : ''}`}
                            >
                                <div className="ext_image">
                                    <svg aria-hidden="true">
                                        <use
                                            href={`/assets/extension-icons.svg#svg-${card.icon}`}
                                        />
                                    </svg>
                                </div>
                                <div className="ext_info">
                                    <div className="name">{card.title}</div>
                                    <div className="short_desc">
                                        {card.description}
                                    </div>
                                    <div className="more">więcej</div>
                                    <div className="activate">
                                        {card.status}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </VersumShell>
        </RouteGuard>
    );
}
