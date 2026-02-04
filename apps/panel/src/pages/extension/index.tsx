import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';

type ExtensionCard = {
    title: string;
    description: string;
    status: 'Aktywny' | 'Nieaktywny';
};

const cards: ExtensionCard[] = [
    {
        title: 'Marketing Automatyczny',
        description:
            'Skorzystaj z nowoczesnych rozwiązań marketingowych, które zwiększą skuteczność.',
        status: 'Aktywny',
    },
    {
        title: 'Program Lojalnościowy',
        description:
            'Buduj lojalność i zaangażowanie obecnych klientów i przyciągaj do salonu nowe osoby.',
        status: 'Nieaktywny',
    },
    {
        title: 'Zasoby',
        description:
            'Automatycznie sprawdza dostępność urządzeń i pomieszczeń podczas wprowadzania wizyt.',
        status: 'Nieaktywny',
    },
    {
        title: 'Bony i Karnety',
        description:
            'Zaoferuj swoim klientom bony, karty podarunkowe i karnety.',
        status: 'Nieaktywny',
    },
    {
        title: 'Fiskalizacja',
        description:
            'Włącz funkcję fiskalizacji i drukuj paragony na drukarce fiskalnej.',
        status: 'Nieaktywny',
    },
    {
        title: 'Kalendarz Google',
        description:
            'Idealne rozwiązanie organizacyjne dla osób pracujących w kilku miejscach.',
        status: 'Nieaktywny',
    },
    {
        title: 'Ograniczenie Dostępu',
        description:
            'Ogranicz dostęp do systemu dla wybranych godzin, urządzeń lub adresów IP.',
        status: 'Nieaktywny',
    },
];

export default function ExtensionPage() {
    return (
        <RouteGuard roles={['admin']} permission="nav:extension">
            <DashboardLayout>
                <div className="versum-page" data-testid="extension-page">
                    <header className="versum-page__header">
                        <h1 className="versum-page__title">Dodatki</h1>
                    </header>
                    <div className="versum-extension-grid">
                        {cards.map((card) => (
                            <article
                                key={card.title}
                                className="versum-extension-card"
                            >
                                <h3>{card.title}</h3>
                                <p>{card.description}</p>
                                <p className="mt-4 text-xs text-gray-600">
                                    status:{' '}
                                    <strong
                                        className={
                                            card.status === 'Aktywny'
                                                ? 'text-emerald-600'
                                                : 'text-gray-500'
                                        }
                                    >
                                        {card.status}
                                    </strong>
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        </RouteGuard>
    );
}
