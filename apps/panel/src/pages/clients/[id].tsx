'use client';

import { useRouter } from 'next/router';
import Link from 'next/link';
import type { Route } from 'next';
import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import ClientDetailNav from '@/components/versum/navs/ClientDetailNav';
import { useAuth } from '@/contexts/AuthContext';
import {
    useCustomer,
    useUpdateCustomer,
    useCustomerStatistics,
    useCustomerEventHistory,
} from '@/hooks/useCustomers';
import type { Customer, CustomerTag } from '@/types';
import CustomerPersonalDataTab from '@/components/customers/CustomerPersonalDataTab';
import {
    CustomerStatisticsTab,
    CustomerHistoryTab,
    CustomerNotesTab,
    CustomerGalleryTab,
    CustomerFilesTab,
    CustomerCommunicationTab,
} from '@/components/customers';

type TabId =
    | 'summary'
    | 'personal'
    | 'statistics'
    | 'history'
    | 'comments'
    | 'communication'
    | 'gallery'
    | 'files';

const tabs: { id: TabId; label: string }[] = [
    { id: 'summary', label: 'podsumowanie' },
    { id: 'personal', label: 'dane osobowe' },
    { id: 'statistics', label: 'statystyki' },
    { id: 'history', label: 'historia wizyt' },
    { id: 'comments', label: 'komentarze' },
    { id: 'communication', label: 'komunikacja' },
    { id: 'gallery', label: 'galeria zdjęć' },
    { id: 'files', label: 'załączone pliki' },
];

export default function CustomerDetailPage() {
    const router = useRouter();
    const { role } = useAuth();
    const { id } = router.query;
    const customerId = id ? Number(id) : null;
    const [activeTab, setActiveTab] = useState<TabId>('summary');

    const { data: customer, isLoading, error } = useCustomer(customerId);
    const { data: stats } = useCustomerStatistics(customerId ?? 0);
    const { data: history } = useCustomerEventHistory(customerId ?? 0, {
        limit: 3,
    });
    const updateCustomer = useUpdateCustomer();

    const handleUpdate = async (data: Partial<Customer>) => {
        if (!customerId) return;
        await updateCustomer.mutateAsync({ id: customerId, data });
    };

    if (!role) return null;

    // Custom sidebar for client detail page (KARTA KLIENTA)
    const clientDetailSidebar = customer ? (
        <ClientDetailNav
            customerId={customer.id}
            customerName={customer.name}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        />
    ) : null;

    return (
        <RouteGuard
            roles={['admin', 'employee', 'receptionist']}
            permission="nav:clients"
        >
            <VersumShell role={role} secondaryNav={clientDetailSidebar}>
                <div className="customer-detail-page">
                    {/* Breadcrumbs - Versum style */}
                    <ul className="breadcrumb">
                        <li>Klienci / {customer?.name || '...'}</li>
                    </ul>

                    {isLoading ? (
                        <div className="customer-loading">
                            Ładowanie danych klienta...
                        </div>
                    ) : error ? (
                        <div className="customer-error">
                            <p>Nie udało się załadować danych klienta</p>
                            <Link
                                href={'/clients' as Route}
                                className="versum-btn versum-btn--default"
                            >
                                Wróć do listy klientów
                            </Link>
                        </div>
                    ) : customer ? (
                        <>
                            {/* Nagłówek karty klienta */}
                            <div className="customer-card-header">
                                <div className="customer-card-nav">
                                    <div className="customer-card-title">
                                        Karta klienta
                                    </div>
                                    <div className="customer-card-name">
                                        <Link
                                            href={`/clients/${customer.id}`}
                                            className="customer-name-link"
                                        >
                                            {customer.name}
                                        </Link>
                                    </div>
                                    {/* Tabs */}
                                    <ul className="customer-tabs">
                                        {tabs.map((tab) => (
                                            <li
                                                key={tab.id}
                                                className={
                                                    activeTab === tab.id
                                                        ? 'active'
                                                        : ''
                                                }
                                            >
                                                <a
                                                    onClick={() =>
                                                        setActiveTab(tab.id)
                                                    }
                                                >
                                                    {tab.label}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="customer-card-content">
                                {activeTab === 'summary' && (
                                    <CustomerSummaryView
                                        customer={customer}
                                        stats={stats}
                                        history={history}
                                    />
                                )}
                                {activeTab === 'personal' && (
                                    <CustomerPersonalDataTab
                                        customer={customer}
                                        onUpdate={handleUpdate}
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
                                        onUpdate={handleUpdate}
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
                                href={'/clients' as Route}
                                className="versum-btn versum-btn--default"
                            >
                                Wróć do listy klientów
                            </Link>
                        </div>
                    )}
                </div>
            </VersumShell>
        </RouteGuard>
    );
}

// View Components - Versum 1:1 Style
function CustomerSummaryView({
    customer,
    stats,
    history,
}: {
    customer: Customer;
    stats: CustomerSummaryStats | null | undefined;
    history: CustomerHistory | null | undefined;
}) {
    const upcomingVisits = stats?.upcomingVisits ?? [];
    const historyItems = history?.items ?? [];

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

    return (
        <div className="customer-summary">
            {/* Header with actions - Versum style */}
            <div className="customer-summary-header">
                <div className="customer-actions">
                    <Link
                        href={`/clients/${customer.id}/edit`}
                        className="btn btn-default"
                    >
                        edytuj
                    </Link>
                    <button className="btn btn-default">więcej ▼</button>
                </div>
            </div>

            {/* Customer Info Card - Versum 1:1 */}
            <div className="customer-info-card">
                <div className="customer-info-main">
                    <h1 className="customer-name">
                        {customer.fullName || customer.name}
                    </h1>
                    <div className="customer-info-details">
                        {customer.phone && (
                            <div className="customer-info-item">
                                <span className="label">📞</span>
                                <a href={`tel:${customer.phone}`}>
                                    {customer.phone}
                                </a>
                            </div>
                        )}
                        <div className="customer-info-item">
                            <span className="label">✉</span>
                            {customer.email ? (
                                <a href={`mailto:${customer.email}`}>
                                    {customer.email}
                                </a>
                            ) : (
                                <span className="text-muted">nie podano</span>
                            )}
                        </div>
                        {customer.tags && customer.tags.length > 0 && (
                            <div className="customer-info-item">
                                <span className="label">🏷️</span>
                                <span>
                                    {customer.tags
                                        .map((t: CustomerTag) => t.name)
                                        .join(', ')}
                                </span>
                            </div>
                        )}
                        <div className="customer-info-item">
                            <span className="label">📝</span>
                            {customer.description ? (
                                <span>{customer.description}</span>
                            ) : (
                                <>
                                    <span className="text-muted">
                                        brak opisu
                                    </span>
                                    <a href="#" className="link-edit">
                                        edytuj opis
                                    </a>
                                </>
                            )}
                        </div>
                        {customer.gender && (
                            <div className="customer-info-item">
                                <span className="label">płeć</span>
                                <span>
                                    {customer.gender === 'female'
                                        ? 'Kobieta'
                                        : customer.gender === 'male'
                                          ? 'Mężczyzna'
                                          : 'Inna'}
                                </span>
                            </div>
                        )}
                        <div className="customer-info-item">
                            <span className="label">data dodania</span>
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
