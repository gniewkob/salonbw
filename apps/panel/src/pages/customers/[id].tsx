import { useRouter } from 'next/router';
import Link from 'next/link';
import type { Route } from 'next';
import { useMemo } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import ClientDetailNav from '@/components/salonbw/navs/ClientDetailNav';
import VersumBreadcrumbs from '@/components/salonbw/VersumBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import {
    useCustomer,
    useDeleteCustomer,
    useTagsForCustomer,
    useCustomerStatistics,
    useCustomerEventHistory,
} from '@/hooks/useCustomers';
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

export default function CustomerDetailPage() {
    const router = useRouter();
    const { role } = useAuth();
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
    const { data: customerTags } = useTagsForCustomer(customerId);
    const { data: stats } = useCustomerStatistics(customerId);
    const { data: history } = useCustomerEventHistory(customerId, {
        limit: 3,
    });

    const secondaryNav = useMemo(
        () =>
            customerId !== null ? (
                <div className="sidenav" id="sidenav">
                    <ClientDetailNav
                        customerId={customerId}
                        customerName={
                            customer?.fullName || customer?.name || '...'
                        }
                        customerGender={customer?.gender}
                        activeTab={activeTab}
                    />
                </div>
            ) : null,
        [
            customerId,
            customer?.fullName,
            customer?.name,
            customer?.gender,
            activeTab,
        ],
    );

    // Push custom sidebar to persistent outer shell (must be before any early return)
    useSetSecondaryNav(secondaryNav);

    if (!role) return null;

    return (
        <RouteGuard
            roles={['admin', 'employee', 'receptionist']}
            permission="nav:customers"
        >
            <SalonBWShell role={role}>
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
                                    className="salonbw-btn salonbw-btn--default"
                                >
                                    Wróć do listy klientów
                                </Link>
                            </div>
                        </div>
                    }
                >
                    <div className="show_customer" id="customers_main">
                        <VersumBreadcrumbs
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
                                    className="salonbw-btn salonbw-btn--default"
                                >
                                    Wróć do listy klientów
                                </Link>
                            </div>
                        ) : error ? (
                            <div className="customer-error">
                                <p>Nie udało się załadować danych klienta</p>
                                <Link
                                    href={'/customers' as Route}
                                    className="salonbw-btn salonbw-btn--default"
                                >
                                    Wróć do listy klientów
                                </Link>
                            </div>
                        ) : customer ? (
                            <>
                                <div className="buttons-row">
                                    <div className="right-buttons">
                                        <Link
                                            href={`/customers/${customer.id}/edit`}
                                            className="button button-small"
                                        >
                                            edytuj
                                        </Link>
                                        <details className="customer-more-dropdown">
                                            <summary className="button button-small customer-more-dropdown__trigger">
                                                więcej{' '}
                                                <span className="caret" />
                                            </summary>
                                            <ul className="customer-more-dropdown__menu">
                                                <li>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            window.print()
                                                        }
                                                    >
                                                        drukuj
                                                    </button>
                                                </li>
                                                <li>
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            role !== 'admin' ||
                                                            deleteCustomer.isPending
                                                        }
                                                        title={
                                                            role !== 'admin'
                                                                ? 'Tylko administrator może usunąć klienta'
                                                                : undefined
                                                        }
                                                        onClick={() => {
                                                            if (
                                                                !customer ||
                                                                !confirm(
                                                                    'Czy na pewno chcesz usunąć klienta?',
                                                                )
                                                            ) {
                                                                return;
                                                            }
                                                            void deleteCustomer
                                                                .mutateAsync(
                                                                    customer.id,
                                                                )
                                                                .then(() =>
                                                                    router.push(
                                                                        '/customers',
                                                                    ),
                                                                )
                                                                .catch(
                                                                    (err) => {
                                                                        const message =
                                                                            err instanceof
                                                                            Error
                                                                                ? err.message
                                                                                : 'Nie udało się usunąć klienta';
                                                                        alert(
                                                                            message,
                                                                        );
                                                                    },
                                                                );
                                                        }}
                                                    >
                                                        usuń klienta
                                                    </button>
                                                </li>
                                            </ul>
                                        </details>
                                    </div>
                                </div>

                                {/* Content */}
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
                            </>
                        ) : (
                            <div className="customer-error">
                                <p>Nie znaleziono klienta</p>
                                <Link
                                    href={'/customers' as Route}
                                    className="salonbw-btn salonbw-btn--default"
                                >
                                    Wróć do listy klientów
                                </Link>
                            </div>
                        )}
                    </div>
                </CustomerErrorBoundary>
            </SalonBWShell>
        </RouteGuard>
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
    const avatarShape =
        customer.gender === 'female'
            ? 'female'
            : customer.gender === 'male'
              ? 'male'
              : 'neutral';

    return (
        <div className="customer-info-summary" id="summary">
            <div className="row-col_row">
                <div className="row">
                    <div className="col-sm-6">
                        <div className="row-col single-detail-row">
                            <h2>{customer.fullName || customer.name}</h2>
                        </div>
                        <div className="details-row">
                            <div className="row-col single-detail-row">
                                <span className="icon_box">
                                    <i
                                        className="icon sprite-customer_telephone"
                                        aria-hidden="true"
                                    />
                                </span>
                                {customer.phone ? (
                                    <a href={`tel:${customer.phone}`}>
                                        {customer.phone}
                                    </a>
                                ) : (
                                    <span className="light_text">
                                        nie podano
                                    </span>
                                )}
                            </div>
                            <div className="row-col single-detail-row">
                                <span className="icon_box">
                                    <i
                                        className="icon sprite-customer_email"
                                        aria-hidden="true"
                                    />
                                </span>
                                {customer.email ? (
                                    <a href={`mailto:${customer.email}`}>
                                        {customer.email}
                                    </a>
                                ) : (
                                    <span className="light_text">
                                        nie podano
                                    </span>
                                )}
                            </div>
                            <div className="row-col single-detail-row">
                                <span className="icon_box">
                                    <i
                                        className="icon sprite-group"
                                        aria-hidden="true"
                                    />
                                </span>
                                <span>
                                    {groupsOrTags.length
                                        ? groupsOrTags.join(', ')
                                        : 'nie podano'}
                                </span>
                            </div>
                            <div className="row-col single-detail-row">
                                <span className="icon_box">
                                    <i
                                        className="icon sprite-customer_description"
                                        aria-hidden="true"
                                    />
                                </span>
                                {customer.description ? (
                                    <span>{customer.description}</span>
                                ) : (
                                    <>
                                        <span className="light_text">
                                            brak opisu
                                        </span>
                                        <Link
                                            href={`/customers/${customer.id}/edit`}
                                            className="link-edit"
                                        >
                                            edytuj opis
                                        </Link>
                                    </>
                                )}
                            </div>
                            <div className="row-col single-detail-row">
                                <span className="lbl">płeć</span>
                                <span>{genderLabel}</span>
                            </div>
                            <div className="row-col single-detail-row">
                                <span className="lbl">data dodania</span>
                                <span>{formatDate(customer.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="col-sm-6">
                        <div
                            className={`customer-avatar customer-avatar--${avatarShape}`}
                        >
                            <svg
                                viewBox="0 0 120 120"
                                className="avatar-placeholder"
                            >
                                <circle cx="60" cy="60" r="60" fill="#e8eaed" />
                                {avatarShape === 'female' ? (
                                    <path
                                        d="M60 18c-16.6 0-30 13.4-30 30 0 8.8 3.8 16.8 9.8 22.3-9.9 4-24.8 12.7-24.8 27.7V104h90v-6c0-15-14.9-23.7-24.8-27.7 6-5.5 9.8-13.5 9.8-22.3 0-16.6-13.4-30-30-30zm0 13c9.4 0 17 7.6 17 17 0 3.9-1.3 7.4-3.6 10.2l-3.4-6.2-7.4 7.3-9.3-17.7-4.7 10.2-4.5-.8c-.3 1-.5 2.1-.5 3.2 0 9.4 7.6 17 17 17z"
                                        fill="#c3c7cc"
                                    />
                                ) : (
                                    <path
                                        d="M60 65c13.8 0 25-11.2 25-25S73.8 15 60 15 35 26.2 35 40s11.2 25 25 25zm0 2.5c-16.7 0-50 8.3-50 25v12.5h100v-12.5c0-16.7-33.3-25-50-25z"
                                        fill="#bdc1c6"
                                    />
                                )}
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-sm-6">
                        <div className="info-box">
                            <p className="box-title">
                                zaplanowane wizyty: {upcomingVisits.length}
                            </p>
                            <div className="box-rows">
                                {upcomingVisits.length > 0 ? (
                                    <>
                                        {upcomingVisits
                                            .slice(0, 3)
                                            .map((visit) => (
                                                <div
                                                    key={visit.id}
                                                    className="row-col single-detail-row"
                                                >
                                                    <div className="visit-service">
                                                        <Link
                                                            href={`/services/${visit.serviceId}`}
                                                        >
                                                            {visit.serviceName}
                                                        </Link>
                                                        <div className="visit-details">
                                                            {formatDateTime(
                                                                visit.date,
                                                                visit.time,
                                                            )}
                                                            ,{' '}
                                                            {visit.employeeName}
                                                        </div>
                                                    </div>
                                                    <div className="visit-price">
                                                        {formatCurrency(
                                                            visit.price,
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                    </>
                                ) : (
                                    <p className="light_text">
                                        Klient nie ma zaplanowanych wizyt
                                    </p>
                                )}
                                <Link
                                    href={`/customers/${customer.id}?tab_name=events_history`}
                                    className="link-more"
                                >
                                    więcej
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="col-sm-6">
                        <div className="info-box">
                            <p className="box-title">
                                zrealizowane wizyty:{' '}
                                {stats?.completedVisits || 0}
                            </p>
                            <div className="box-rows">
                                {historyItems.length > 0 ? (
                                    <>
                                        {historyItems
                                            .slice(0, 3)
                                            .map((visit) => (
                                                <div
                                                    key={visit.id}
                                                    className="row-col single-detail-row"
                                                >
                                                    <div className="visit-service">
                                                        <Link
                                                            href={`/services/${visit.service?.id}`}
                                                        >
                                                            {
                                                                visit.service
                                                                    ?.name
                                                            }
                                                        </Link>
                                                        <div className="visit-details">
                                                            {formatDateTime(
                                                                visit.date,
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="visit-employee">
                                                        <Link
                                                            href={`/employees/${visit.employee?.id}`}
                                                        >
                                                            {visit.employee
                                                                ?.initials ||
                                                                visit.employee?.name
                                                                    ?.split(' ')
                                                                    .map(
                                                                        (
                                                                            n: string,
                                                                        ) =>
                                                                            n[0],
                                                                    )
                                                                    .join('')}
                                                        </Link>
                                                    </div>
                                                    <div className="visit-price">
                                                        {formatCurrency(
                                                            visit.price,
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        <Link
                                            href={`/customers/${customer.id}?tab_name=events_history`}
                                            className="link-more"
                                        >
                                            więcej
                                        </Link>
                                    </>
                                ) : (
                                    <p className="light_text">
                                        Brak zrealizowanych wizyt
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
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
