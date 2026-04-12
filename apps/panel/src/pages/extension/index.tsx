import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';

type ExtensionCard = {
    id: string;
    toolId: string;
    colClass: 'ext_1' | 'ext_2';
    title: string;
    description: string;
    icon: string;
    status: 'Aktywny' | 'Nieaktywny';
};

const cards: ExtensionCard[] = [
    {
        id: 'automatic_marketing',
        toolId: '4',
        colClass: 'ext_1',
        title: 'Marketing Automatyczny',
        description:
            'Skorzystaj z nowoczesnych rozwiązań marketingowych, które zaskoczą Cię swoją skutecznością.',
        icon: 'automatic_marketing',
        status: 'Aktywny',
    },
    {
        id: 'lumo',
        toolId: '6',
        colClass: 'ext_2',
        title: 'Program Lojalnościowy',
        description:
            'Buduj lojalność i zaangażowanie obecnych klientów i przyciągaj do salonu nowe osoby.',
        icon: 'lumo',
        status: 'Nieaktywny',
    },
    {
        id: 'resources',
        toolId: '7',
        colClass: 'ext_1',
        title: 'Zasoby',
        description:
            'Automatycznie sprawdza dostępność urządzeń i pomieszczeń podczas wprowadzania wizyt. Eliminuje błędne rezerwacje i oszczędza czas.',
        icon: 'resources',
        status: 'Nieaktywny',
    },
    {
        id: 'gift_cards',
        toolId: '8',
        colClass: 'ext_2',
        title: 'Bony i Karnety',
        description:
            'Zaoferuj swoim klientom bony, karty podarunkowe i karnety. Z dodatkiem Bony i karnety będzie to łatwiejsze niż kiedykolwiek!',
        icon: 'gift_cards',
        status: 'Nieaktywny',
    },
    {
        id: 'fiscalization',
        toolId: '3',
        colClass: 'ext_1',
        title: 'Fiskalizacja',
        description:
            'Włącz funkcję fiskalizacji i drukuj paragony na drukarce fiskalnej prosto z Versum. Zobacz, jakie to szybkie i proste!',
        icon: 'fiscalization',
        status: 'Nieaktywny',
    },
    {
        id: 'google_calendar',
        toolId: '1',
        colClass: 'ext_2',
        title: 'Kalendarz Google',
        description:
            'Idealne rozwiązanie organizacyjne dla osób pracujących w kilku miejscach.',
        icon: 'google_calendar',
        status: 'Nieaktywny',
    },
    {
        id: 'access_restriction',
        toolId: '5',
        colClass: 'ext_1',
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

    const rows: Array<ExtensionCard[]> = [];
    for (let i = 0; i < cards.length; i += 2) {
        rows.push(cards.slice(i, i + 2));
    }

    return (
        <RouteGuard roles={['admin']} permission="nav:extension">
            <SalonShell role={role}>
                <div className="salonbw-page" data-testid="extension-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_extensions"
                        items={[{ label: 'Dodatki' }]}
                    />
                    <div className="extensions_boxes versum-extension-grid salonbw-extension-grid">
                        {rows.map((row, rowIndex) => (
                            <div
                                key={`row-${rowIndex}`}
                                className={`row row_${rowIndex}`}
                            >
                                {row.map((card) => (
                                    <div
                                        key={card.id}
                                        className="col-md-6 reduced-padding"
                                    >
                                        <Link
                                            href={`/extension/tools/${card.toolId}`}
                                            className="box-link"
                                            data-testid={`extension-card-${card.id}`}
                                        >
                                            <div
                                                className={`ext-col ${card.colClass} ext_active`}
                                            >
                                                <div className="ext_image">
                                                    <svg
                                                        className={`svg-${card.icon}`}
                                                        aria-hidden="true"
                                                    >
                                                        <use
                                                            href={`/assets/extension-icons.svg#svg-${card.icon}`}
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="ext_info">
                                                    <div className="name">
                                                        {card.title}
                                                    </div>
                                                    <div className="short_desc">
                                                        {card.description}
                                                    </div>
                                                    <div className="more float-left">
                                                        więcej
                                                    </div>
                                                    <div className="activate float-right">
                                                        {'status:'}
                                                        {card.status ===
                                                        'Aktywny' ? (
                                                            <>
                                                                <div className="icon sprite-active_green" />
                                                                <div className="state active">
                                                                    Aktywny
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="state inactive">
                                                                Nieaktywny
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="c" />
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
