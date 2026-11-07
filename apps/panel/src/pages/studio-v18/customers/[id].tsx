import { useCommunicationState } from '@/hooks/useCommunicationConsents';
import type { CommunicationChannel } from '@/api/communicationConsents';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import {
    ArrowLeftIcon,
    CalendarDaysIcon,
    PencilSquareIcon,
    Squares2X2Icon,
    TagIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/contexts/AuthContext';
import { getPostLoginRoute } from '@/utils/postLoginRoute';
import V18EditCustomerModal from '@/components/v18/V18EditCustomerModal';
import V18CustomerTagManager from '@/components/v18/V18CustomerTagManager';
import V18CustomerBooking from '@/components/v18/V18CustomerBooking';
import V18Customer360Sections from '@/components/v18/V18Customer360Sections';
import {
    useCustomer,
    useCustomerStatistics,
    useTagsForCustomer,
} from '@/hooks/useCustomers';
import foundation from '@/styles/V18Foundation.module.css';
import styles from '@/styles/V18CustomerProfile.module.css';

const formatDate = (date?: string | null) => {
    if (!date) return '—';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '—';
    return new Intl.DateTimeFormat('pl-PL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(parsed);
};

const formatCurrency = (value?: number | null) =>
    value == null || !Number.isFinite(value)
        ? '—'
        : new Intl.NumberFormat('pl-PL', {
              style: 'currency',
              currency: 'PLN',
          }).format(value);

function ConsentStatus({ label, value }: { label: string; value?: boolean }) {
    return (
        <div className={styles.consentRow}>
            <span>{label}</span>
            <span
                className={
                    value === true
                        ? styles.consentYes
                        : value === false
                          ? styles.consentNo
                          : styles.consentUnknown
                }
            >
                {value === true
                    ? 'Tak'
                    : value === false
                      ? 'Nie'
                      : 'Brak danych'}
            </span>
        </div>
    );
}

/**
 * V18 customer workspace. The existing authenticated CRM APIs and workflow
 * components remain the source of truth for every customer operation.
 */
function V18CustomerProfile() {
    const router = useRouter();
    const { role } = useAuth();
    const dashboardHref =
        role === 'admin' ? '/studio-v18' : getPostLoginRoute(role);
    const rawId = router.query.id;
    const customerId =
        typeof rawId === 'string' &&
        /^[1-9][0-9]*$/.test(rawId) &&
        Number.isSafeInteger(Number(rawId))
            ? Number(rawId)
            : null;
    const customerQuery = useCustomer(customerId);
    const communication = useCommunicationState(
        customerId ? { kind: 'customer', customerId } : null,
    );
    // Audited DIRECT_MARKETING status; UNKNOWN (incl. legacy flags without
    // evidence) renders as "unknown", never as consent.
    const marketingConsent = (channel: CommunicationChannel) => {
        const status = communication.data?.consents.find(
            (c) => c.purpose === 'DIRECT_MARKETING' && c.channel === channel,
        )?.status;
        return status === 'GRANTED'
            ? true
            : status === 'WITHDRAWN'
              ? false
              : undefined;
    };
    const statisticsQuery = useCustomerStatistics(customerId);
    const tagsQuery = useTagsForCustomer(customerId);
    const [editing, setEditing] = useState(false);
    const [managingTags, setManagingTags] = useState(false);
    const [bookingOpen, setBookingOpen] = useState(false);
    const customer = customerQuery.data;
    const name = customer?.fullName || customer?.name || 'Karta klienta';
    const address = [
        customer?.address ?? '',
        customer?.postalCode ?? '',
        customer?.city ?? '',
    ]
        .filter(Boolean)
        .join(', ');

    return (
        <div
            className={foundation.foundation}
            data-testid="v18-customer-profile"
        >
            <div className={foundation.layout}>
                <nav
                    className={foundation.rail}
                    aria-label="Nawigacja Studio V18"
                >
                    <Link
                        href={dashboardHref}
                        className={foundation.railBrand}
                        aria-label="Dashboard V18"
                    >
                        B<span>/</span>W
                    </Link>
                    <Link
                        href={dashboardHref}
                        className={foundation.railLink}
                        aria-label="Dashboard"
                    >
                        <Squares2X2Icon
                            width={23}
                            height={23}
                            aria-hidden="true"
                        />
                    </Link>
                    <Link
                        href="/studio-v18/customers"
                        className={[
                            foundation.railLink,
                            foundation.railActive,
                        ].join(' ')}
                        aria-current="page"
                        aria-label="Klienci V18"
                    >
                        <UsersIcon width={23} height={23} aria-hidden="true" />
                    </Link>
                </nav>

                <main className={foundation.surface} id="main-content">
                    <div className={foundation.breadcrumbs}>
                        <Link href={dashboardHref}>Studio V18</Link>
                        <span aria-hidden="true">/</span>
                        <Link href="/studio-v18/customers">Klienci</Link>
                        <span aria-hidden="true">/</span>
                        <span>Karta klienta</span>
                    </div>

                    <div className={styles.backRow}>
                        <Link
                            href="/studio-v18/customers"
                            className={styles.backLink}
                        >
                            <ArrowLeftIcon
                                width={17}
                                height={17}
                                aria-hidden="true"
                            />
                            Wróć do klientów V18
                        </Link>
                        <span className={styles.pilotLabel}>
                            Podgląd karty · DEV
                        </span>
                    </div>

                    {!router.isReady ? (
                        <p role="status" className={styles.state}>
                            Ładowanie karty klienta…
                        </p>
                    ) : customerId === null ? (
                        <p role="alert" className={styles.state}>
                            Nieprawidłowy identyfikator klienta.
                        </p>
                    ) : customerQuery.isLoading ? (
                        <p role="status" className={styles.state}>
                            Ładowanie danych klienta…
                        </p>
                    ) : customerQuery.isError || !customer ? (
                        <div role="alert" className={styles.state}>
                            <p>Nie udało się pobrać karty klienta.</p>
                            <button
                                type="button"
                                className={styles.actionSecondary}
                                onClick={() => void customerQuery.refetch()}
                            >
                                Ponów pobieranie
                            </button>
                        </div>
                    ) : (
                        <>
                            <header className={styles.hero}>
                                <div className={styles.identity}>
                                    <span className={styles.eyebrow}>
                                        Salon Black &amp; White · CRM 360°
                                    </span>
                                    <h1>{name}</h1>
                                    <p>
                                        Karta klienta #{customer.id} · dodano{' '}
                                        {formatDate(customer.createdAt)}
                                    </p>
                                </div>
                                <div className={styles.actions}>
                                    <button
                                        type="button"
                                        onClick={() => setBookingOpen(true)}
                                        className={styles.actionPrimary}
                                    >
                                        <CalendarDaysIcon
                                            width={18}
                                            height={18}
                                            aria-hidden="true"
                                        />
                                        Umów wizytę
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.actionSecondary}
                                        onClick={() => setEditing(true)}
                                    >
                                        <PencilSquareIcon
                                            width={18}
                                            height={18}
                                            aria-hidden="true"
                                        />
                                        Edytuj klienta
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.actionSecondary}
                                        onClick={() => setManagingTags(true)}
                                    >
                                        <TagIcon
                                            width={18}
                                            height={18}
                                            aria-hidden="true"
                                        />
                                        Zarządzaj tagami
                                    </button>
                                </div>
                            </header>

                            <section
                                className={styles.metrics}
                                aria-label="Statystyki klienta"
                            >
                                <div className={styles.metric}>
                                    <span>Wszystkie wizyty</span>
                                    <strong>
                                        {statisticsQuery.data?.totalVisits ??
                                            '—'}
                                    </strong>
                                </div>
                                <div className={styles.metric}>
                                    <span>Wizyty zrealizowane</span>
                                    <strong>
                                        {statisticsQuery.data
                                            ?.completedVisits ?? '—'}
                                    </strong>
                                </div>
                                <div className={styles.metric}>
                                    <span>Łączne wydatki</span>
                                    <strong>
                                        {formatCurrency(
                                            statisticsQuery.data?.totalSpent,
                                        )}
                                    </strong>
                                </div>
                                <div className={styles.metric}>
                                    <span>Ostatnia wizyta</span>
                                    <strong>
                                        {formatDate(
                                            statisticsQuery.data
                                                ?.lastVisitDate ??
                                                customer.lastVisitDate,
                                        )}
                                    </strong>
                                </div>
                            </section>
                            {statisticsQuery.isError ? (
                                <p role="status" className={styles.warning}>
                                    Statystyki wizyt są chwilowo niedostępne.
                                    Dane kontaktowe klienta nadal są aktualne.
                                </p>
                            ) : null}

                            <div className={styles.columns}>
                                <section
                                    className={styles.panel}
                                    aria-label="Dane klienta"
                                >
                                    <h2>Dane kontaktowe</h2>
                                    <dl className={styles.fields}>
                                        <div>
                                            <dt>Telefon</dt>
                                            <dd>
                                                {customer.phone ? (
                                                    <a
                                                        href={
                                                            'tel:' +
                                                            customer.phone
                                                        }
                                                    >
                                                        {customer.phone}
                                                    </a>
                                                ) : (
                                                    '—'
                                                )}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>E-mail</dt>
                                            <dd>
                                                {customer.email ? (
                                                    <a
                                                        href={
                                                            'mailto:' +
                                                            customer.email
                                                        }
                                                    >
                                                        {customer.email}
                                                    </a>
                                                ) : (
                                                    '—'
                                                )}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>Data urodzenia</dt>
                                            <dd>
                                                {formatDate(customer.birthDate)}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>Adres</dt>
                                            <dd>{address || '—'}</dd>
                                        </div>
                                    </dl>
                                </section>

                                <section
                                    className={styles.panel}
                                    aria-label="Grupy i tagi klienta"
                                >
                                    <h2>Grupy i tagi</h2>
                                    <h3>Grupy</h3>
                                    {customer.groups === undefined ? (
                                        <p className={styles.muted}>
                                            Brak danych o przypisaniu do grup.
                                        </p>
                                    ) : customer.groups.length === 0 ? (
                                        <p className={styles.muted}>
                                            Klient nie należy do żadnej grupy.
                                        </p>
                                    ) : (
                                        <div className={styles.pills}>
                                            {customer.groups.map((group) => (
                                                <span
                                                    key={group.id}
                                                    className={styles.pill}
                                                >
                                                    {group.name}
                                                    {group.discountPercent !=
                                                    null
                                                        ? ' · ' +
                                                          group.discountPercent +
                                                          '%'
                                                        : ''}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <h3>Tagi</h3>
                                    {tagsQuery.isLoading ? (
                                        <p className={styles.muted}>
                                            Ładowanie tagów…
                                        </p>
                                    ) : tagsQuery.isError ? (
                                        <p
                                            role="status"
                                            className={styles.muted}
                                        >
                                            Tagi są chwilowo niedostępne.
                                        </p>
                                    ) : tagsQuery.data?.length ? (
                                        <div className={styles.pills}>
                                            {tagsQuery.data.map((tag) => (
                                                <span
                                                    key={tag.id}
                                                    className={styles.pill}
                                                >
                                                    <span
                                                        className={
                                                            styles.tagDot
                                                        }
                                                        style={{
                                                            backgroundColor:
                                                                tag.color &&
                                                                /^#[0-9a-fA-F]{6}$/.test(
                                                                    tag.color,
                                                                )
                                                                    ? tag.color
                                                                    : '#67538a',
                                                        }}
                                                        aria-hidden="true"
                                                    />
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className={styles.muted}>
                                            Brak przypisanych tagów.
                                        </p>
                                    )}
                                </section>

                                <section
                                    className={styles.panel}
                                    aria-label="Zgody klienta"
                                >
                                    <h2>Zgody i komunikacja</h2>
                                    <ConsentStatus
                                        label="RODO"
                                        value={customer.gdprConsent}
                                    />
                                    <ConsentStatus
                                        label="Marketing SMS"
                                        value={marketingConsent('SMS')}
                                    />
                                    <ConsentStatus
                                        label="Marketing E-mail"
                                        value={marketingConsent('EMAIL')}
                                    />
                                    <ConsentStatus
                                        label="Marketing WhatsApp"
                                        value={marketingConsent('WHATSAPP')}
                                    />
                                    <ConsentStatus
                                        label="Regulamin"
                                        value={customer.termsConsent}
                                    />
                                </section>
                            </div>
                            <V18Customer360Sections
                                key={customer.id}
                                customer={customer}
                                onEditConsents={() => setEditing(true)}
                            />
                        </>
                    )}
                </main>
            </div>
            {customer ? (
                <>
                    <V18EditCustomerModal
                        open={editing}
                        customerId={customer.id}
                        onClose={() => setEditing(false)}
                        onSuccess={() => {
                            setEditing(false);
                            void customerQuery.refetch();
                        }}
                        onDeleted={() => {
                            setEditing(false);
                            void router.push('/studio-v18/customers');
                        }}
                    />
                    {bookingOpen ? (
                        <V18CustomerBooking
                            key={customer.id}
                            customerId={customer.id}
                            customerName={name}
                            onClose={() => setBookingOpen(false)}
                        />
                    ) : null}
                    {managingTags ? (
                        <V18CustomerTagManager
                            key={customer.id}
                            customerId={customer.id}
                            customerName={name}
                            onClose={() => setManagingTags(false)}
                            onChanged={() => {
                                void tagsQuery.refetch();
                                void customerQuery.refetch();
                            }}
                        />
                    ) : null}
                </>
            ) : null}
        </div>
    );
}

export default function StudioV18CustomerProfilePage() {
    return (
        <RouteGuard
            roles={['admin', 'employee', 'receptionist']}
            permission="nav:customers"
        >
            <Head>
                <title>Karta klienta V18 — Salon Black &amp; White</title>
                <meta name="robots" content="noindex,nofollow" />
            </Head>
            <V18CustomerProfile />
        </RouteGuard>
    );
}

export const getServerSideProps: GetServerSideProps = async ({
    req,
    params,
}) => {
    const host = (req.headers.host ?? '').split(':')[0].toLowerCase();
    const dev =
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'development' ||
        process.env.NODE_ENV === 'development';
    const rawId = params?.id;
    const validId =
        typeof rawId === 'string' &&
        /^[1-9][0-9]*$/.test(rawId) &&
        Number.isSafeInteger(Number(rawId));

    if (
        !dev ||
        !['dev-panel.salon-bw.pl', 'localhost', '127.0.0.1'].includes(host) ||
        !validId
    ) {
        return { notFound: true };
    }

    return { props: {} };
};
