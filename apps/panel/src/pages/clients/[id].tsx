'use client';

import { useRouter } from 'next/router';
import Link from 'next/link';
import type { Route } from 'next';
import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';
import {
    useCustomer,
    useTagsForCustomer,
    useUpdateCustomer,
    useCustomerStatistics,
    useCustomerEventHistory,
} from '@/hooks/useCustomers';
import type { Customer } from '@/types';
import CustomerPersonalDataTab from '@/components/customers/CustomerPersonalDataTab';
import CustomerConsentsTab from '@/components/customers/CustomerConsentsTab';

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
    const { data: tags } = useTagsForCustomer(customerId);
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

    return (
        <RouteGuard
            roles={['admin', 'employee', 'receptionist']}
            permission="nav:clients"
        >
            <VersumShell role={role}>
                <div className="customer-detail-page">
                    {/* Breadcrumbs */}
                    <ul className="breadcrumb">
                        <li>
                            <Link href="/clients">Klienci</Link>
                        </li>
                        <li className="active">/ {customer?.name}</li>
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
                                    <CustomerStatisticsView
                                        customerId={customer.id}
                                    />
                                )}
                                {activeTab === 'history' && (
                                    <CustomerHistoryView
                                        customerId={customer.id}
                                    />
                                )}
                                {activeTab === 'comments' && (
                                    <CustomerCommentsView
                                        customerId={customer.id}
                                    />
                                )}
                                {activeTab === 'communication' && (
                                    <CustomerCommunicationView
                                        customer={customer}
                                    />
                                )}
                                {activeTab === 'gallery' && (
                                    <CustomerGalleryView
                                        customerId={customer.id}
                                    />
                                )}
                                {activeTab === 'files' && (
                                    <CustomerFilesView
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

// View Components
function CustomerSummaryView({
    customer,
    stats,
    history,
}: {
    customer: Customer;
    stats: any;
    history: any;
}) {
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

    return (
        <div className="customer-summary">
            {/* Header with actions */}
            <div className="customer-summary-header">
                <div className="customer-actions">
                    <Link
                        href={`/clients/${customer.id}/edit`}
                        className="versum-btn versum-btn--default"
                    >
                        edytuj
                    </Link>
                    <button className="versum-btn versum-btn--default">
                        więcej ▼
                    </button>
                </div>
            </div>

            {/* Customer Info Card */}
            <div className="customer-info-card">
                <div className="customer-info-main">
                    <h2 className="customer-name">
                        <Link href={`/clients/${customer.id}`}>
                            {customer.name}
                        </Link>
                    </h2>
                    <div className="customer-info-details">
                        {customer.phone && (
                            <div className="customer-info-item">
                                <a href={`tel:${customer.phone}`}>
                                    {customer.phone}
                                </a>
                            </div>
                        )}
                        <div className="customer-info-item">
                            <span className="customer-label">email</span>
                            <span>
                                {customer.email || (
                                    <span className="text-muted">
                                        nie podano
                                    </span>
                                )}
                            </span>
                        </div>
                        {customer.groups && customer.groups.length > 0 && (
                            <div className="customer-info-item">
                                <span className="customer-label">
                                    należy do grup
                                </span>
                                <span>
                                    {customer.groups
                                        .map((g) => g.name)
                                        .join(', ')}
                                </span>
                            </div>
                        )}
                        <div className="customer-info-item">
                            <span className="customer-label">opis</span>
                            <span>
                                {customer.description || (
                                    <>
                                        <span className="text-muted">
                                            brak opisu
                                        </span>{' '}
                                        <a href="#" className="link-edit">
                                            edytuj opis
                                        </a>
                                    </>
                                )}
                            </span>
                        </div>
                        {customer.gender && (
                            <div className="customer-info-item">
                                <span>płeć</span>
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
                            <span>data dodania</span>
                            <span>{formatDate(customer.createdAt)}</span>
                        </div>
                    </div>
                </div>
                <div className="customer-avatar">
                    <img
                        src="/images/avatar-placeholder.png"
                        alt=""
                        className="avatar-image"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                                'none';
                        }}
                    />
                </div>
            </div>

            {/* Visits Sections */}
            <div className="customer-visits">
                {/* Upcoming visits */}
                <div className="visits-section">
                    <h3>
                        zaplanowane wizyty: {stats?.upcomingVisits?.length || 0}
                    </h3>
                    {stats?.upcomingVisits?.length > 0 ? (
                        <div className="visits-list">
                            {stats.upcomingVisits.map((visit: any) => (
                                <div key={visit.id} className="visit-item">
                                    <div className="visit-service">
                                        <Link
                                            href={`/services/${visit.serviceId}`}
                                        >
                                            {visit.serviceName}
                                        </Link>
                                    </div>
                                    <div className="visit-details">
                                        {formatDate(visit.date)} {visit.time},{' '}
                                        {visit.employeeName}
                                    </div>
                                    <div className="visit-price">
                                        {formatCurrency(visit.price)}
                                    </div>
                                </div>
                            ))}
                            <Link
                                href={`/clients/${customer.id}?tab=history`}
                                className="link-more"
                            >
                                więcej
                            </Link>
                        </div>
                    ) : (
                        <p className="text-muted">Brak zaplanowanych wizyt</p>
                    )}
                </div>

                {/* Completed visits */}
                <div className="visits-section">
                    <h3>zrealizowane wizyty: {stats?.completedVisits || 0}</h3>
                    {history?.items?.length > 0 ? (
                        <div className="visits-list">
                            {history.items.map((visit: any) => (
                                <div key={visit.id} className="visit-item">
                                    <div className="visit-service">
                                        <Link
                                            href={`/services/${visit.service?.id}`}
                                        >
                                            {visit.service?.name}
                                        </Link>
                                    </div>
                                    <div className="visit-details">
                                        {formatDate(visit.date)}
                                    </div>
                                    <div className="visit-employee">
                                        <Link
                                            href={`/employees/${visit.employee?.id}`}
                                        >
                                            {visit.employee?.name
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
                            <Link
                                href={`/clients/${customer.id}?tab=history`}
                                className="link-more"
                            >
                                więcej
                            </Link>
                        </div>
                    ) : (
                        <p className="text-muted">Brak zrealizowanych wizyt</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function CustomerStatisticsView({ customerId }: { customerId: number }) {
    return (
        <div className="customer-tab-content">
            <h3>Statystyki klienta</h3>
            <p>Tu będą statystyki...</p>
        </div>
    );
}

function CustomerHistoryView({ customerId }: { customerId: number }) {
    return (
        <div className="customer-tab-content">
            <h3>Historia wizyt</h3>
            <p>Tu będzie historia wizyt...</p>
        </div>
    );
}

function CustomerCommentsView({ customerId }: { customerId: number }) {
    return (
        <div className="customer-tab-content">
            <h3>Komentarze</h3>
            <p>Tu będą komentarze...</p>
        </div>
    );
}

function CustomerCommunicationView({ customer }: { customer: Customer }) {
    return (
        <div className="customer-tab-content">
            <h3>Komunikacja</h3>
            <p>Tu będzie historia komunikacji...</p>
        </div>
    );
}

function CustomerGalleryView({ customerId }: { customerId: number }) {
    return (
        <div className="customer-tab-content">
            <h3>Galeria zdjęć</h3>
            <p>Tu będzie galeria...</p>
        </div>
    );
}

function CustomerFilesView({ customerId }: { customerId: number }) {
    return (
        <div className="customer-tab-content">
            <h3>Załączone pliki</h3>
            <p>Tu będą pliki...</p>
        </div>
    );
}
