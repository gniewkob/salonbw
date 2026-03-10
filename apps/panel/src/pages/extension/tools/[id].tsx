import Link from 'next/link';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';

type PlanAvailability = {
    available: boolean;
    price?: string;
};

type ToolData = {
    id: string;
    title: string;
    description: string;
    icon: string;
    status: 'Aktywny' | 'Nieaktywny';
    trial: string;
    price: string;
    plans: {
        solo: PlanAvailability;
        basic: PlanAvailability;
        medium: PlanAvailability;
        pro: PlanAvailability;
    };
    settingsUrl?: string;
};

const TOOLS: Record<string, ToolData> = {
    automatic_marketing: {
        id: 'automatic_marketing',
        title: 'Marketing Automatyczny',
        description:
            'Codziennie w Twoim salonie pojawiają się klienci, ale czy wiesz ilu z nich zobaczysz u siebie ponownie? Marketing Automatyczny pomoże Ci zachęcić ich do powrotu. System analizuje historię wizyt klientów i w odpowiednim momencie automatycznie wysyła do nich wiadomości z indywidualnymi ofertami lub zaproszeniami na kolejne wizyty.',
        icon: 'automatic_marketing',
        status: 'Aktywny',
        trial: '30 dni darmowego okresu testowego',
        price: '69,00 zł',
        plans: {
            solo: { available: true, price: '69 zł' },
            basic: { available: true, price: '69 zł' },
            medium: { available: true, price: '69 zł' },
            pro: { available: true, price: 'bezpłatny' },
        },
        settingsUrl: '/settings/marketing_creator/calendar',
    },
    lumo: {
        id: 'lumo',
        title: 'Program Lojalnościowy',
        description:
            'Twoi stali klienci zapewniają Ci większość przychodów, a stabilny rozwój salonu możliwy jest tylko dzięki powiększaniu ich grona. Program Lojalnościowy pozwoli Ci nawiązywać trwałe relacje i zwiększać zaangażowanie klientów. Zasady programu opierają się na zbieraniu punktów przez uczestników, które w przyszłości będą oni mogli wymienić na nagrody.',
        icon: 'lumo',
        status: 'Nieaktywny',
        trial: '14 dni darmowego okresu testowego',
        price: '109,00 zł',
        plans: {
            solo: { available: true, price: '109 zł' },
            basic: { available: true, price: '109 zł' },
            medium: { available: true, price: '109 zł' },
            pro: { available: true, price: '109 zł' },
        },
    },
    resources: {
        id: 'resources',
        title: 'Zasoby',
        description:
            'Automatycznie sprawdza dostępność urządzeń i pomieszczeń podczas wprowadzania wizyt. Eliminuje błędne rezerwacje i oszczędza czas.',
        icon: 'resources',
        status: 'Nieaktywny',
        trial: '30 dni darmowego okresu testowego',
        price: '39,00 zł',
        plans: {
            solo: { available: false },
            basic: { available: true, price: '39 zł' },
            medium: { available: true, price: '39 zł' },
            pro: { available: true, price: '39 zł' },
        },
    },
    gift_cards: {
        id: 'gift_cards',
        title: 'Bony i Karnety',
        description:
            'Zaoferuj swoim klientom bony, karty podarunkowe i karnety. Z dodatkiem Bony i karnety będzie to łatwiejsze niż kiedykolwiek!',
        icon: 'gift_cards',
        status: 'Nieaktywny',
        trial: '30 dni darmowego okresu testowego',
        price: '39,00 zł',
        plans: {
            solo: { available: false },
            basic: { available: true, price: '39 zł' },
            medium: { available: true, price: '39 zł' },
            pro: { available: true, price: '39 zł' },
        },
    },
    fiscalization: {
        id: 'fiscalization',
        title: 'Fiskalizacja',
        description:
            'Włącz funkcję fiskalizacji i drukuj paragony na drukarce fiskalnej prosto z Versum. Zobacz, jakie to szybkie i proste!',
        icon: 'fiscalization',
        status: 'Nieaktywny',
        trial: '30 dni darmowego okresu testowego',
        price: '29,00 zł',
        plans: {
            solo: { available: true, price: '29 zł' },
            basic: { available: true, price: '29 zł' },
            medium: { available: true, price: '29 zł' },
            pro: { available: true, price: '29 zł' },
        },
    },
    google_calendar: {
        id: 'google_calendar',
        title: 'Kalendarz Google',
        description:
            'Idealne rozwiązanie organizacyjne dla osób pracujących w kilku miejscach.',
        icon: 'google_calendar',
        status: 'Nieaktywny',
        trial: '30 dni darmowego okresu testowego',
        price: '19,00 zł',
        plans: {
            solo: { available: true, price: '19 zł' },
            basic: { available: true, price: '19 zł' },
            medium: { available: true, price: '19 zł' },
            pro: { available: true, price: 'bezpłatny' },
        },
    },
    access_restriction: {
        id: 'access_restriction',
        title: 'Ograniczenie Dostępu',
        description:
            'Ogranicz dostęp do systemu dla wybranych godzin, urządzeń lub adresów IP.',
        icon: 'access_restriction',
        status: 'Nieaktywny',
        trial: '30 dni darmowego okresu testowego',
        price: '19,00 zł',
        plans: {
            solo: { available: false },
            basic: { available: true, price: '19 zł' },
            medium: { available: true, price: '19 zł' },
            pro: { available: true, price: '19 zł' },
        },
    },
};

const PLANS = ['solo', 'basic', 'medium', 'pro'] as const;

export default function ExtensionToolPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:extension">
            <VersumShell role={role}>
                <ExtensionToolContent />
            </VersumShell>
        </RouteGuard>
    );
}

function ExtensionToolContent() {
    const router = useRouter();
    const id = router.query.id as string;
    const tool = id ? TOOLS[id] : undefined;

    return (
        <div className="versum-page" data-testid="extension-tool-page">
            <ul className="breadcrumb">
                <li>
                    <Link href="/extension">Dodatki</Link>
                </li>
                <li>/ {tool?.title ?? id}</li>
            </ul>

            {tool ? (
                <div className="inner extension_info">
                    <div className="row">
                        <div className="col-sm-6 logo_with_actions">
                            <div className="row">
                                <div className="extension_icon col-xs-3">
                                    <svg aria-hidden="true">
                                        <use
                                            href={`/assets/extension-icons.svg#svg-${tool.icon}`}
                                        />
                                    </svg>
                                </div>
                                <div className="col-xs-9">
                                    <div className="ext_title">
                                        {tool.title}
                                    </div>
                                    <div className="ext_price_title">
                                        {tool.trial}
                                        <br />
                                        <strong>{tool.price}</strong>
                                        {' / miesiąc'}
                                    </div>
                                    <div className="row vertical-align status-info">
                                        {tool.status === 'Aktywny' ? (
                                            <>
                                                <div className="col-xs-6">
                                                    {'status: '}
                                                    <span
                                                        className="icon sprite-active_green"
                                                        aria-hidden="true"
                                                    />
                                                    <span className="state active">
                                                        Aktywny
                                                    </span>
                                                </div>
                                                <div className="col-xs-6">
                                                    <div className="update_extension">
                                                        <a href="#">
                                                            Wyłącz dodatek
                                                        </a>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="col-xs-6">
                                                    <button
                                                        type="button"
                                                        className="button button-blue"
                                                    >
                                                        wypróbuj za darmo
                                                    </button>
                                                </div>
                                                <div className="col-xs-6">
                                                    {'status: '}
                                                    <span className="state inactive">
                                                        Nieaktywny
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-xs-12">
                                    <div className="desc">
                                        <p>{tool.description}</p>
                                    </div>
                                    {tool.status === 'Aktywny' &&
                                        tool.settingsUrl && (
                                            <a
                                                className="button"
                                                href={tool.settingsUrl}
                                            >
                                                <span
                                                    className="icon sprite-settings_blue mr-xs"
                                                    aria-hidden="true"
                                                />
                                                ustawienia dodatku
                                            </a>
                                        )}
                                    <h2>Dostępność</h2>
                                    <table className="table-bordered availability-table no-hover">
                                        <thead>
                                            <tr>
                                                {PLANS.map((plan) => (
                                                    <th
                                                        key={plan}
                                                        className={
                                                            tool.status ===
                                                                'Aktywny' &&
                                                            plan === 'basic'
                                                                ? 'currently-active'
                                                                : ''
                                                        }
                                                    >
                                                        {plan
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            plan.slice(1)}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                {PLANS.map((plan) => {
                                                    const p = tool.plans[plan];
                                                    return (
                                                        <td key={plan}>
                                                            {p.available ? (
                                                                <>
                                                                    <span
                                                                        className="availability-check"
                                                                        aria-label="dostępny"
                                                                    >
                                                                        ✓
                                                                    </span>
                                                                    <br />
                                                                    {p.price}
                                                                    {p.price &&
                                                                        p.price !==
                                                                            'bezpłatny' && (
                                                                            <div className="small">
                                                                                netto
                                                                                /
                                                                                miesiąc
                                                                            </div>
                                                                        )}
                                                                </>
                                                            ) : (
                                                                <span
                                                                    className="availability-no"
                                                                    aria-label="niedostępny"
                                                                >
                                                                    —
                                                                </span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <p className="versum-muted p-20">Nie znaleziono dodatku.</p>
            )}
        </div>
    );
}
