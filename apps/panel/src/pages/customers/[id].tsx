import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import type { Route } from 'next';
import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import ConfirmModal from '@/components/ConfirmModal';
import {
    useCustomer,
    useDeleteCustomer,
    useTagsForCustomer,
    useCustomerStatistics,
    useCustomerEventHistory,
} from '@/hooks/useCustomers';
import { useCustomerAlerts } from '@/hooks/useCustomerAlerts';
import type { Customer, CustomerTag } from '@/types';
import {
    CustomerStatisticsTab,
    CustomerPersonalDataView,
    CustomerHistoryTab,
    CustomerNotesTab,
    CustomerGalleryTab,
    CustomerFilesTab,
    CustomerCommunicationTab,
} from '@/components/customers';
import CustomerErrorBoundary from '@/components/customers/CustomerErrorBoundary';

type TabId =
    | 'summary'
    | 'personal'
    | 'statistics'
    | 'history'
    | 'comments'
    | 'communication'
    | 'gallery'
    | 'files';

function parseNumericIdParam(
    value: string | string[] | undefined,
): number | null {
    if (!value) return null;
    const raw = Array.isArray(value) ? value[0] : value;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}

function parseCustomerIdFromRoute(
    idParam: string | string[] | undefined,
    asPath: string,
): number | null {
    const fromParam = parseNumericIdParam(idParam);
    if (fromParam !== null) return fromParam;

    const match = asPath.match(/^\/customers\/(\d+)(?:[/?#]|$)/);
    if (!match) return null;

    const n = Number(match[1]);
    return Number.isFinite(n) ? n : null;
}

function parseTabNameParam(
    value: string | string[] | undefined,
): string | null {
    if (!value) return null;
    return Array.isArray(value) ? value[0] : value;
}

function tabIdFromTabName(tabName: string | null): TabId {
    switch (tabName) {
        case 'personal_data':
            return 'personal';
        case 'statistics':
            return 'statistics';
        case 'events_history':
            return 'history';
        case 'opinions':
            return 'comments';
        case 'communication_preferences':
            return 'communication';
        case 'gallery':
            return 'gallery';
        case 'files':
            return 'files';
        default:
            return 'summary';
    }
}

const CUSTOMER_TABS: ReadonlyArray<{
    id: TabId;
    label: string;
    tabName?: string;
}> = [
    { id: 'summary', label: 'Przegląd' },
    { id: 'personal', label: 'Dane', tabName: 'personal_data' },
    { id: 'history', label: 'Historia', tabName: 'events_history' },
    { id: 'statistics', label: 'Statystyki', tabName: 'statistics' },
    { id: 'comments', label: 'Notatki', tabName: 'opinions' },
    {
        id: 'communication',
        label: 'Komunikacja',
        tabName: 'communication_preferences',
    },
    { id: 'gallery', label: 'Zdjęcia', tabName: 'gallery' },
    { id: 'files', label: 'Pliki', tabName: 'files' },
];

export default function CustomerDetailPage() {
    const router = useRouter();
    const { role } = useAuth();
    const toast = useToast();
    const { id } = router.query;
    const parsedCustomerId = parseCustomerIdFromRoute(id, router.asPath);
    const customerId =
        parsedCustomerId !== null && parsedCustomerId > 0
            ? parsedCustomerId
            : null;
    const hasInvalidCustomerId =
        router.isReady && parsedCustomerId !== null && parsedCustomerId <= 0;
    const activeTab = tabIdFromTabName(
        parseTabNameParam(router.query.tab_name),
    );

    const {
        data: customer,
        isLoading: isCustomerLoading,
        error,
    } = useCustomer(customerId);
    const deleteCustomer = useDeleteCustomer();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const { data: customerTags } = useTagsForCustomer(customerId);
    const { data: stats } = useCustomerStatistics(customerId);
    const { data: history } = useCustomerEventHistory(customerId, {
        limit: 3,
    });

    // The customer card owns its navigation inside the page. A second
    // Versum-style sidebar made the view cramped and duplicated controls.
    useSetSecondaryNav(null);

    return (
        <RouteGuard
            roles={['admin', 'employee', 'receptionist']}
            permission="nav:customers"
        >
            <Head>
                <title>
                    {customer?.name
                        ? `${customer.name} — Salon Black & White`
                        : 'Klient — Salon Black & White'}
                </title>
            </Head>
            <SalonShell role={role}>
                <CustomerErrorBoundary
                    fallback={
                        <div className="show_customer" id="customers_main">
                            <div className="customer-error">
                                <p>
                                    Wystąpił błąd podczas renderowania karty
                                    klienta.
                                </p>
                                <Link
                                    href={'/customers' as Route}
                                    className="btn btn-outline-secondary"
                                >
                                    Wróć do listy klientów
                                </Link>
                            </div>
                        </div>
                    }
                >
                    <div className="show_customer" id="customers_main">
                        <SalonBreadcrumbs
                            iconClass="sprite-breadcrumbs_customers"
                            items={[
                                { label: 'Klienci', href: '/customers' },
                                { label: customer?.name || '...' },
                            ]}
                        />

                        {!router.isReady || isCustomerLoading ? (
                            <div className="customer-loading">
                                Ładowanie danych klienta...
                            </div>
                        ) : hasInvalidCustomerId ? (
                            <div className="customer-error">
                                <p>Nieprawidłowy identyfikator klienta</p>
                                <Link
                                    href={'/customers' as Route}
                                    className="btn btn-outline-secondary"
                                >
                                    Wróć do listy klientów
                                </Link>
                            </div>
                        ) : error ? (
                            <div className="customer-error">
                                <p>Nie udało się załadować danych klienta</p>
                                <Link
                                    href={'/customers' as Route}
                                    className="btn btn-outline-secondary"
                                >
                                    Wróć do listy klientów
                                </Link>
                            </div>
                        ) : customer ? (
                            <>
                                <CustomerDetailHeader
                                    customer={customer}
                                    tags={customerTags ?? []}
                                    stats={stats}
                                    role={role}
                                    deleting={deleteCustomer.isPending}
                                    onDelete={() => setConfirmDelete(true)}
                                />

                                <CustomerDetailTabs
                                    customerId={customer.id}
                                    activeTab={activeTab}
                                />

                                <div className="customer-detail-workspace">
                                    <div
                                        className="customer-card-content customers_main_show_customer"
                                        id="pjax_container"
                                    >
                                        {activeTab === 'summary' && (
                                            <CustomerSummaryView
                                                customer={customer}
                                                tags={customerTags ?? []}
                                                stats={stats}
                                                history={history}
                                            />
                                        )}
                                        {activeTab === 'personal' && (
                                            <CustomerPersonalDataView
                                                customer={customer}
                                            />
                                        )}
                                        {activeTab === 'statistics' && (
                                            <CustomerStatisticsTab
                                                customerId={customer.id}
                                            />
                                        )}
                                        {activeTab === 'history' && (
                                            <CustomerHistoryTab
                                                customerId={customer.id}
                                            />
                                        )}
                                        {activeTab === 'comments' && (
                                            <CustomerNotesTab
                                                customerId={customer.id}
                                            />
                                        )}
                                        {activeTab === 'communication' && (
                                            <CustomerCommunicationTab
                                                customer={customer}
                                            />
                                        )}
                                        {activeTab === 'gallery' && (
                                            <CustomerGalleryTab
                                                customerId={customer.id}
                                            />
                                        )}
                                        {activeTab === 'files' && (
                                            <CustomerFilesTab
                                                customerId={customer.id}
                                            />
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="customer-error">
                                <p>Nie znaleziono klienta</p>
                                <Link
                                    href={'/customers' as Route}
                                    className="btn btn-outline-secondary"
                                >
                                    Wróć do listy klientów
                                </Link>
                            </div>
                        )}
                    </div>
                </CustomerErrorBoundary>
                <ConfirmModal
                    open={confirmDelete}
                    title="Usuń klienta"
                    message="Czy na pewno chcesz usunąć klienta? Operacja jest nieodwracalna."
                    confirmLabel="Usuń"
                    confirmVariant="danger"
                    onConfirm={() => {
                        setConfirmDelete(false);
                        if (!customer) return;
                        void deleteCustomer
                            .mutateAsync(customer.id)
                            .then(() => router.push('/customers'))
                            .catch((err) => {
                                const message =
                                    err instanceof Error
                                        ? err.message
                                        : 'Nie udało się usunąć klienta';
                                toast.error(message);
                            });
                    }}
                    onCancel={() => setConfirmDelete(false)}
                />
            </SalonShell>
        </RouteGuard>
    );
}

function CustomerDetailTabs({
    customerId,
    activeTab,
}: {
    customerId: number;
    activeTab: TabId;
}) {
    return (
        <nav className="customer-detail-tabs" aria-label="Sekcje karty klienta">
            {CUSTOMER_TABS.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                    <Link
                        key={tab.id}
                        href={
                            tab.id === 'summary'
                                ? `/customers/${customerId}`
                                : {
                                      pathname: `/customers/${customerId}`,
                                      query: { tab_name: tab.tabName },
                                  }
                        }
                        aria-current={isActive ? 'page' : undefined}
                        className={`customer-detail-tabs__item${
                            isActive ? ' is-active' : ''
                        }`}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}

function CustomerDetailHeader({
    customer,
    tags,
    stats,
    role,
    deleting,
    onDelete,
}: {
    customer: Customer;
    tags: CustomerTag[];
    stats: CustomerSummaryStats | null | undefined;
    role: string | null;
    deleting: boolean;
    onDelete: () => void;
}) {
    const displayName = customer.fullName || customer.name;
    const customerInitials =
        displayName
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'K';
    const groupsOrTags = [
        ...(customer.groups?.map((g) => g.name) ?? []),
        ...(tags.map((t) => t.name) ?? []),
    ].filter(Boolean);

    // avatarUrl zapisany na koncie klientki wskazuje self-scoped
    // /users/profile/avatar/<plik> — staff pobiera przez staff-owy endpoint
    // /users/:id/avatar/<plik>; absolutne URL-e (social login) bez zmian.
    const staffAvatarUrl = customer.avatarUrl?.replace(
        '/users/profile/avatar/',
        `/users/${customer.id}/avatar/`,
    );

    return (
        <section className="customer-detail-hero">
            <div className="customer-detail-hero__identity">
                <div
                    className={`customer-detail-hero__avatar${staffAvatarUrl ? ' customer-detail-hero__avatar--image' : ''}`}
                    aria-hidden="true"
                >
                    {staffAvatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img alt="" src={staffAvatarUrl} />
                    ) : (
                        customerInitials
                    )}
                </div>
                <div>
                    <span className="customer-detail-eyebrow">
                        Karta klienta
                    </span>
                    <h1>{displayName}</h1>
                    <div className="customer-detail-hero__contacts">
                        {customer.phone ? (
                            <a href={`tel:${customer.phone}`}>
                                {customer.phone}
                            </a>
                        ) : (
                            <span>Brak telefonu</span>
                        )}
                        {customer.email ? (
                            <a href={`mailto:${customer.email}`}>
                                {customer.email}
                            </a>
                        ) : (
                            <span>Brak emaila</span>
                        )}
                    </div>
                    <div className="customer-detail-hero__meta">
                        <span>
                            {groupsOrTags.length
                                ? groupsOrTags.join(', ')
                                : 'Bez grupy'}
                        </span>
                        <span>
                            Dodano:{' '}
                            {new Date(customer.createdAt).toLocaleDateString(
                                'pl-PL',
                            )}
                        </span>
                    </div>
                </div>
            </div>

            <div className="customer-detail-hero__metrics">
                <MetricTile
                    label="Wizyty"
                    value={stats?.totalVisits ?? 0}
                    hint={`${stats?.completedVisits ?? 0} zrealizowanych`}
                />
                <MetricTile
                    label="Zaplanowane"
                    value={stats?.upcomingVisits?.length ?? 0}
                    hint="najbliższe terminy"
                />
                <MetricTile
                    label="Rabat"
                    value={
                        customer.resolvedDiscountPercent ??
                        customer.discountPercent ??
                        0
                    }
                    suffix="%"
                    hint="stały klienta/grupy"
                />
            </div>

            <div className="customer-detail-hero__actions">
                <Link
                    href={`/customers/${customer.id}/edit`}
                    className="btn btn-salon btn-sm"
                >
                    Edytuj dane
                </Link>
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => window.print()}
                >
                    Drukuj
                </button>
                <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    disabled={role !== 'admin' || deleting}
                    title={
                        role !== 'admin'
                            ? 'Tylko administrator może usunąć klienta'
                            : undefined
                    }
                    onClick={onDelete}
                >
                    Usuń
                </button>
            </div>
        </section>
    );
}

function MetricTile({
    label,
    value,
    hint,
    suffix = '',
}: {
    label: string;
    value: number;
    hint: string;
    suffix?: string;
}) {
    return (
        <div className="customer-detail-metric">
            <span>{label}</span>
            <strong>
                {value}
                {suffix}
            </strong>
            <small>{hint}</small>
        </div>
    );
}

// View components - source UI style
function CustomerSummaryView({
    customer,
    tags,
    stats,
    history,
}: {
    customer: Customer;
    tags: CustomerTag[];
    stats: CustomerSummaryStats | null | undefined;
    history: CustomerHistory | null | undefined;
}) {
    const { alerts: customerAlerts } = useCustomerAlerts(customer.id);
    const upcomingVisits = Array.isArray(stats?.upcomingVisits)
        ? stats.upcomingVisits
        : [];
    const historyItems = Array.isArray(history?.items) ? history.items : [];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
        }).format(amount);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pl-PL');
    };

    const formatDateTime = (dateStr: string, timeStr?: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const formatted = date.toLocaleDateString('pl-PL');
        return timeStr ? `${formatted} ${timeStr}` : formatted;
    };
    const genderLabel =
        customer.gender === 'female'
            ? 'Kobieta'
            : customer.gender === 'male'
              ? 'Mężczyzna'
              : customer.gender === 'other'
                ? 'Inna'
                : 'Nie podano';
    const groupsOrTags = [
        ...(customer.groups?.map((g) => g.name) ?? []),
        ...(tags.map((t) => t.name) ?? []),
    ].filter(Boolean);
    return (
        <div className="customer-info-summary" id="summary">
            <div className="customer-summary-grid">
                <section className="customer-summary-panel">
                    <div className="customer-summary-panel__header">
                        <h2>Profil i kontakt</h2>
                        <Link
                            href={`/customers/${customer.id}/edit`}
                            className="customer-summary-panel__action"
                        >
                            Edytuj dane
                        </Link>
                    </div>
                    <dl className="customer-summary-list">
                        <div>
                            <dt>Telefon</dt>
                            <dd>
                                {customer.phone ? (
                                    <a href={`tel:${customer.phone}`}>
                                        {customer.phone}
                                    </a>
                                ) : (
                                    'Nie podano'
                                )}
                            </dd>
                        </div>
                        <div>
                            <dt>Email</dt>
                            <dd>
                                {customer.email ? (
                                    <a href={`mailto:${customer.email}`}>
                                        {customer.email}
                                    </a>
                                ) : (
                                    'Nie podano'
                                )}
                            </dd>
                        </div>
                        <div>
                            <dt>Grupa / tagi</dt>
                            <dd>
                                {groupsOrTags.length
                                    ? groupsOrTags.join(', ')
                                    : 'Nie podano'}
                            </dd>
                        </div>
                        <div>
                            <dt>Płeć</dt>
                            <dd>{genderLabel}</dd>
                        </div>
                        <div>
                            <dt>Data dodania</dt>
                            <dd>{formatDate(customer.createdAt)}</dd>
                        </div>
                    </dl>
                    <div className="customer-summary-note">
                        <span>Opis</span>
                        <p>{customer.description || 'Brak opisu klienta.'}</p>
                    </div>
                </section>

                <section className="customer-summary-panel">
                    <div className="customer-summary-panel__header">
                        <h2>Kontekst CRM</h2>
                        <Link
                            href={`/customers/${customer.id}?tab_name=events_history`}
                            className="customer-summary-panel__action"
                        >
                            Timeline
                        </Link>
                    </div>
                    {customerAlerts.length > 0 ? (
                        <div className="customer-summary-alerts">
                            {customerAlerts.slice(0, 4).map((alert) => (
                                <span
                                    key={alert.id}
                                    className={`customer-summary-alert customer-summary-alert--${alert.severity}`}
                                >
                                    {alert.label}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="customer-summary-empty">
                            Brak aktywnych alertów.
                        </p>
                    )}
                    <dl className="customer-summary-list customer-summary-list--compact">
                        <div>
                            <dt>Zaplanowane wizyty</dt>
                            <dd>{upcomingVisits.length}</dd>
                        </div>
                        <div>
                            <dt>Zrealizowane wizyty</dt>
                            <dd>{stats?.completedVisits ?? 0}</dd>
                        </div>
                        <div>
                            <dt>Wszystkie wizyty</dt>
                            <dd>{stats?.totalVisits ?? 0}</dd>
                        </div>
                    </dl>
                </section>

                <section className="customer-summary-panel customer-summary-panel--wide">
                    <div className="customer-summary-panel__header">
                        <h2>Zaplanowane wizyty</h2>
                        <Link
                            href={`/customers/${customer.id}?tab_name=events_history`}
                            className="customer-summary-panel__action"
                        >
                            Wszystkie
                        </Link>
                    </div>
                    {upcomingVisits.length > 0 ? (
                        <div className="customer-summary-visits">
                            {upcomingVisits.slice(0, 3).map((visit) => (
                                <div
                                    key={visit.id}
                                    className="customer-summary-visit"
                                >
                                    <div>
                                        <Link
                                            href={`/services/${visit.serviceId}`}
                                        >
                                            {visit.serviceName}
                                        </Link>
                                        <span>
                                            {formatDateTime(
                                                visit.date,
                                                visit.time,
                                            )}
                                            , {visit.employeeName}
                                        </span>
                                    </div>
                                    <strong>
                                        {formatCurrency(visit.price)}
                                    </strong>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="customer-summary-empty">
                            Klient nie ma zaplanowanych wizyt.
                        </p>
                    )}
                </section>

                <section className="customer-summary-panel customer-summary-panel--wide">
                    <div className="customer-summary-panel__header">
                        <h2>Ostatnie wizyty</h2>
                        <Link
                            href={`/customers/${customer.id}?tab_name=events_history`}
                            className="customer-summary-panel__action"
                        >
                            Historia
                        </Link>
                    </div>
                    {historyItems.length > 0 ? (
                        <div className="customer-summary-visits">
                            {historyItems.slice(0, 3).map((visit) => (
                                <div
                                    key={visit.id}
                                    className="customer-summary-visit"
                                >
                                    <div>
                                        <Link
                                            href={`/services/${visit.service?.id}`}
                                        >
                                            {visit.service?.name ?? 'Usługa'}
                                        </Link>
                                        <span>
                                            {formatDateTime(visit.date)}
                                        </span>
                                    </div>
                                    <span
                                        className="customer-summary-employee"
                                        title={
                                            visit.employee?.name ?? undefined
                                        }
                                    >
                                        {visit.employee?.initials ||
                                            visit.employee?.name
                                                ?.split(' ')
                                                .map((n: string) => n[0])
                                                .join('') ||
                                            '-'}
                                    </span>
                                    <strong>
                                        {formatCurrency(visit.price)}
                                    </strong>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="customer-summary-empty">
                            Brak zakończonych wizyt.
                        </p>
                    )}
                </section>
            </div>
        </div>
    );
}

type CustomerUpcomingVisit = {
    id: number;
    serviceId: number;
    serviceName: string;
    date: string;
    time?: string;
    employeeName: string;
    price: number;
};

type CustomerSummaryStats = {
    totalVisits?: number;
    completedVisits?: number;
    upcomingVisits?: CustomerUpcomingVisit[];
};

type CustomerHistoryItem = {
    id: number;
    date: string;
    price: number;
    service?: { id: number; name: string } | null;
    employee?: {
        id: number;
        initials?: string | null;
        name?: string | null;
    } | null;
};

type CustomerHistory = {
    items?: CustomerHistoryItem[];
};
