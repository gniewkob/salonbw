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
    versumToolId: string;
    title: string;
    description: string;
    descriptionMore?: string[];
    icon: string;
    status: 'Aktywny' | 'Nieaktywny';
    trial: string;
    price: string;
    disableUrl?: string;
    plans: {
        solo: PlanAvailability;
        basic: PlanAvailability;
        medium: PlanAvailability;
        pro: PlanAvailability;
    };
    settingsUrl?: string;
    gallery?: {
        main: string;
        thumbs: string[];
    };
};

const TOOLS: Record<string, ToolData> = {
    automatic_marketing: {
        id: 'automatic_marketing',
        versumToolId: '4',
        title: 'Marketing Automatyczny',
        description:
            'Codziennie w Twoim salonie pojawiają się klienci, ale czy wiesz ilu z nich zobaczysz u siebie ponownie? Marketing Automatyczny pomoże Ci zachęcić ich do powrotu. System analizuje historię wizyt klientów i w odpowiednim momencie automatycznie wysyła do nich wiadomości z indywidualnymi ofertami lub zaproszeniami na kolejne wizyty.',
        descriptionMore: [
            'Skutecznie wykorzystując naturalne okazje do kontaktu, Marketing Automatyczny pozwala Ci utrzymać relację z klientami nawet na długo po wizycie w salonie.',
            'Jeśli klient nie pojawia się w Twoim salonie od dłuższego czasu, istnieje ryzyko, że stracisz go na zawsze.',
            'W statystykach skuteczności kampanii promocyjnych sprawdzisz jak wielu klientów wróciło do Twojego salonu oraz jaki obrót wygenerowały osoby objęte Marketingiem Automatycznym.',
        ],
        icon: 'automatic_marketing',
        status: 'Aktywny',
        trial: '30 dni darmowego okresu testowego',
        price: '69,00 zł',
        disableUrl: '/extension/tools/4/disable',
        plans: {
            solo: { available: true, price: '69 zł' },
            basic: { available: true, price: '69 zł' },
            medium: { available: true, price: '69 zł' },
            pro: { available: true, price: 'bezpłatny' },
        },
        settingsUrl: '/settings/marketing_creator/calendar',
        gallery: {
            main: 'https://app-cdn.versum.net/assets/extension/automatic_marketing/screens/pl/marketing_1-40a5c8aeffebfb7fc0c87710f194ea4425e180c07a1ed92de6ca0690b74d55a0.png',
            thumbs: [
                'https://app-cdn.versum.net/assets/extension/automatic_marketing/screens/pl/marketing_2_min-9c16600e5446c7560fc26ecee8b737c2684e056759cafa0fe681fb4efae7ac8a.png',
                'https://app-cdn.versum.net/assets/extension/automatic_marketing/screens/pl/marketing_3_min-b45b20f2e43ecf9d918677682839b3cc29a8140b4aaaa312de2b87146a161e72.png',
                'https://app-cdn.versum.net/assets/extension/automatic_marketing/screens/pl/marketing_4_min-8504d472c5d5229bc09ff364a19ac4f52f3a5723600b7fb22ac7852b2fc5238b.png',
            ],
        },
    },
    lumo: {
        id: 'lumo',
        versumToolId: '6',
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
        versumToolId: '7',
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
        versumToolId: '8',
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
        versumToolId: '3',
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
        versumToolId: '1',
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
        versumToolId: '5',
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
const AVAILABLE_ICON =
    'https://app-cdn.versum.net/assets/extension/available-4567d67edc8aa2198a575753b2b550aa44cf70e86b7e1b28123756826295171a.png';
const TOOL_ALIASES: Record<string, string> = {
    '1': 'google_calendar',
    '3': 'fiscalization',
    '4': 'automatic_marketing',
    '5': 'access_restriction',
    '6': 'lumo',
    '7': 'resources',
    '8': 'gift_cards',
};

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
    const id = String(router.query.id || '');
    const resolvedId = TOOL_ALIASES[id] || id;
    const tool = resolvedId ? TOOLS[resolvedId] : undefined;

    return (
        <div className="versum-page" data-testid="extension-tool-page">
            <ul className="breadcrumb">
                <li>
                    <i className="icon sprite-star" aria-hidden="true" />
                    <Link href="/extension">Dodatki</Link>
                </li>
                <li>{tool?.title ?? resolvedId}</li>
            </ul>

            {tool ? (
                <div className="inner extension_info container-fluid">
                    <div className="row">
                        <div className="col-sm-6 logo_with_actions">
                            <div className="row">
                                <div className="col-xs-3 extension_icon">
                                    <svg
                                        className={`svg-${tool.icon}`}
                                        aria-hidden="true"
                                    >
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
                                                    <div className="icon sprite-active_green" />
                                                    <div className="state active">
                                                        Aktywny
                                                    </div>
                                                </div>
                                                <div className="col-xs-6">
                                                    <div className="update_extension">
                                                        <a
                                                            className="disable_extension_link"
                                                            href={
                                                                tool.disableUrl ||
                                                                '#'
                                                            }
                                                        >
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
                                        {tool.descriptionMore?.length ? (
                                            <>
                                                <a
                                                    data-more-link="true"
                                                    href="#"
                                                >
                                                    czytaj więcej »
                                                </a>
                                                <div className="description_more">
                                                    {tool.descriptionMore.map(
                                                        (text) => (
                                                            <p key={text}>
                                                                {text}
                                                            </p>
                                                        ),
                                                    )}
                                                </div>
                                            </>
                                        ) : null}
                                    </div>
                                    {tool.status === 'Aktywny' &&
                                        tool.settingsUrl && (
                                            <a
                                                className="button"
                                                href={tool.settingsUrl}
                                            >
                                                <div className="icon sprite-settings_blue" />
                                                ustawienia dodatku
                                            </a>
                                        )}
                                </div>
                            </div>
                        </div>
                        {tool.gallery ? (
                            <div className="col-sm-6">
                                <div className="slider">
                                    <div id="gallery">
                                        <div className="row row-no-padding">
                                            <div className="col-xs-12">
                                                <a href={tool.gallery.main}>
                                                    {/* Copy-first parity with Versum gallery markup. */}
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        className="gthumbnail img-responsive"
                                                        alt=""
                                                        src={tool.gallery.main}
                                                    />
                                                </a>
                                            </div>
                                        </div>
                                        <div className="row row-no-padding">
                                            {tool.gallery.thumbs.map(
                                                (thumbUrl, idx) => (
                                                    <div
                                                        key={thumbUrl}
                                                        className="col-xs-4"
                                                    >
                                                        <a href={thumbUrl}>
                                                            {/* Copy-first parity with Versum gallery markup. */}
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                className={`gthumbnail img-responsive ${idx === 1 ? 'center-block' : ''} ${idx === 2 ? 'pull-right' : ''}`}
                                                                alt=""
                                                                src={thumbUrl}
                                                            />
                                                        </a>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                    <h2>Dostępność</h2>
                    <table className="table-bordered availability-table no-hover">
                        <tbody>
                            <tr>
                                {PLANS.map((plan) => (
                                    <th
                                        key={plan}
                                        className={
                                            tool.status === 'Aktywny' &&
                                            plan === 'basic'
                                                ? 'currently-active'
                                                : ''
                                        }
                                    >
                                        {plan.toUpperCase()}
                                    </th>
                                ))}
                            </tr>
                            <tr>
                                {PLANS.map((plan) => {
                                    const p = tool.plans[plan];
                                    return (
                                        <td key={plan}>
                                            {p.available ? (
                                                <>
                                                    {/* Copy-first parity with Versum: native <img> availability icon. */}
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        alt="dostępny"
                                                        title="dostępny"
                                                        src={AVAILABLE_ICON}
                                                    />
                                                    <br />
                                                    {p.price}
                                                    {p.price &&
                                                        p.price !==
                                                            'bezpłatny' && (
                                                            <div className="small">
                                                                netto / miesiąc
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
            ) : (
                <p className="versum-muted p-20">Nie znaleziono dodatku.</p>
            )}
        </div>
    );
}
