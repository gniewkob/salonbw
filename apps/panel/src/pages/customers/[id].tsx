'use client';

import { useRouter } from 'next/router';
import Link from 'next/link';
import type { Route } from 'next';
import { useMemo } from 'react';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import ClientDetailNav from '@/components/versum/navs/ClientDetailNav';
import VersumCustomersVendorCss from '@/components/versum/VersumCustomersVendorCss';
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
                <div className="sidenav secondarynav" id="sidenav">
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
            <VersumShell role={role}>
                <VersumCustomersVendorCss />
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
                                    className="versum-btn versum-btn--default"
                                >
                                    Wróć do listy klientów
                                </Link>
                            </div>
                        </div>
                    }
                >
                    <div className="show_customer" id="customers_main">
                        {/* Breadcrumbs - Versum style */}
                        <ul className="breadcrumb">
                            <li>
                                <i
                                    className="icon sprite-breadcrumbs_customers"
                                    aria-hidden="true"
                                />{' '}
                                Klienci / {customer?.name || '...'}
                            </li>
                        </ul>

                        {!router.isReady || isCustomerLoading ? (
                            <div className="customer-loading">
                                Ładowanie danych klienta...
                            </div>
                        ) : hasInvalidCustomerId ? (
                            <div className="customer-error">
                                <p>Nieprawidłowy identyfikator klienta</p>
                                <Link
                                    href={'/customers' as Route}
                                    className="versum-btn versum-btn--default"
                                >
                                    Wróć do listy klientów
                                </Link>
                            </div>
                        ) : error ? (
                            <div className="customer-error">
                                <p>Nie udało się załadować danych klienta</p>
                                <Link
                                    href={'/customers' as Route}
                                    className="versum-btn versum-btn--default"
                                >
                                    Wróć do listy klientów
                                </Link>
                            </div>
                        ) : customer ? (
                            <>
                                <div className="customer-actions-bar customer_actions">
                                    <div className="customer-actions-bar__spacer" />
                                    <div className="btn-group customer-actions-group">
                                        <Link
                                            href={`/customers/${customer.id}/edit`}
                                            className="button button-light-blue button-small"
                                        >
                                            edytuj
                                        </Link>
                                        <details className="customer-more-dropdown">
                                            <summary className="button button-light-blue button-small customer-more-dropdown__trigger">
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
                                                    <Link
                                                        href={`/customers/${customer.id}?tab_name=personal_data`}
                                                    >
                                                        historia zmian
                                                    </Link>
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
                                    className="versum-btn versum-btn--default"
                                >
                                    Wróć do listy klientów
                                </Link>
                            </div>
                        )}
                    </div>
                </CustomerErrorBoundary>
            </VersumShell>
        </RouteGuard>
    );
}

// View Components - Versum 1:1 Style
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

    return (
        <div className="customer-summary">
            {/* Customer Info Card - Versum 1:1 */}
            <div className="customer-info-card">
                <div className="customer-info-main">
                    <h1 className="customer-name">
                        {customer.fullName || customer.name}
                    </h1>
                    <div className="customer-info-details">
                        {customer.phone && (
                            <div className="customer-info-item">
                                <i
                                    className="icon sprite-customer_telephone customer-info-icon"
                                    aria-hidden="true"
                                />
                                <a href={`tel:${customer.phone}`}>
                                    {customer.phone}
                                </a>
                            </div>
                        )}
                        <div className="customer-info-item">
                            <i
                                className="icon sprite-customer_email customer-info-icon"
                                aria-hidden="true"
                            />
                            {customer.email ? (
                                <a href={`mailto:${customer.email}`}>
                                    {customer.email}
                                </a>
                            ) : (
                                <span className="text-muted">nie podano</span>
                            )}
                        </div>
                        <div className="customer-info-item">
                            <i
                                className="icon sprite-group customer-info-icon"
                                aria-hidden="true"
                            />
                            <span>
                                {groupsOrTags.length
                                    ? groupsOrTags.join(', ')
                                    : 'nie podano'}
                            </span>
                        </div>
                        <div className="customer-info-item">
                            <i
                                className="icon sprite-customer_description customer-info-icon"
                                aria-hidden="true"
                            />
                            {customer.description ? (
                                <span>{customer.description}</span>
                            ) : (
                                <>
                                    <span className="text-muted">
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
                        <div className="customer-info-item">
                            <span className="customer-info-label">płeć</span>
                            <span>{genderLabel}</span>
                        </div>
                        <div className="customer-info-item">
                            <span className="customer-info-label">
                                data dodania
                            </span>
                            <span>{formatDate(customer.createdAt)}</span>
                        </div>
                    </div>
                </div>
                <div className="customer-avatar">
                    <svg viewBox="0 0 120 120" className="avatar-placeholder">
                        <circle cx="60" cy="60" r="60" fill="#e8eaed" />
                        <path
                            d="M60 65c13.8 0 25-11.2 25-25S73.8 15 60 15 35 26.2 35 40s11.2 25 25 25zm0 2.5c-16.7 0-50 8.3-50 25v12.5h100v-12.5c0-16.7-33.3-25-50-25z"
                            fill="#bdc1c6"
                        />
                    </svg>
                </div>
            </div>

            {/* Visits Sections - Versum 1:1 */}
            <div className="customer-visits">
                {/* Upcoming visits */}
                <div className="visits-section">
                    <h3>zaplanowane wizyty: {upcomingVisits.length}</h3>
                    {upcomingVisits.length > 0 ? (
                        <div className="visits-list">
                            {upcomingVisits.slice(0, 3).map((visit) => (
                                <div key={visit.id} className="visit-item">
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
                                            , {visit.employeeName}
                                        </div>
                                    </div>
                                    <div className="visit-price">
                                        {formatCurrency(visit.price)}
                                    </div>
                                </div>
                            ))}
                            {upcomingVisits.length > 3 && (
                                <a href="#" className="link-more">
                                    więcej
                                </a>
                            )}
                        </div>
                    ) : (
                        <p className="text-muted">Brak zaplanowanych wizyt</p>
                    )}
                </div>

                {/* Completed visits */}
                <div className="visits-section">
                    <h3>zrealizowane wizyty: {stats?.completedVisits || 0}</h3>
                    {historyItems.length > 0 ? (
                        <div className="visits-list">
                            {historyItems.slice(0, 3).map((visit) => (
                                <div key={visit.id} className="visit-item">
                                    <div className="visit-service">
                                        <Link
                                            href={`/services/${visit.service?.id}`}
                                        >
                                            {visit.service?.name}
                                        </Link>
                                        <div className="visit-details">
                                            {formatDate(visit.date)}
                                        </div>
                                    </div>
                                    <div className="visit-employee">
                                        <Link
                                            href={`/employees/${visit.employee?.id}`}
                                        >
                                            {visit.employee?.initials ||
                                                visit.employee?.name
                                                    ?.split(' ')
                                                    .map((n: string) => n[0])
                                                    .join('')}
                                        </Link>
                                    </div>
                                    <div className="visit-price">
                                        {formatCurrency(visit.price)}
                                    </div>
                                </div>
                            ))}
                            {(stats?.completedVisits || 0) > 3 && (
                                <a href="#" className="link-more">
                                    więcej
                                </a>
                            )}
                        </div>
                    ) : (
                        <p className="text-muted">Brak zrealizowanych wizyt</p>
                    )}
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
