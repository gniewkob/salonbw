'use client';

import { useState } from 'react';
import { Customer, CustomerTag } from '@/types';
import CustomerSummaryTab from './CustomerSummaryTab';
import CustomerPersonalDataTab from './CustomerPersonalDataTab';
import CustomerStatisticsTab from './CustomerStatisticsTab';
import CustomerHistoryTab from './CustomerHistoryTab';
import CustomerNotesTab from './CustomerNotesTab';
import CustomerConsentsTab from './CustomerConsentsTab';
import CustomerGalleryTab from './CustomerGalleryTab';
import CustomerFilesTab from './CustomerFilesTab';
import CustomerReviewsTab from './CustomerReviewsTab';
import Link from 'next/link';

type TabId =
    | 'summary'
    | 'personal'
    | 'statistics'
    | 'history'
    | 'notes'
    | 'gallery'
    | 'files'
    | 'reviews'
    | 'consents';

const tabs: { id: TabId; label: string }[] = [
    { id: 'summary', label: 'Podsumowanie' },
    { id: 'personal', label: 'Dane osobowe' },
    { id: 'statistics', label: 'Statystyki' },
    { id: 'history', label: 'Historia' },
    { id: 'notes', label: 'Notatki' },
    { id: 'gallery', label: 'Galeria' },
    { id: 'files', label: 'Pliki' },
    { id: 'reviews', label: 'Opinie' },
    { id: 'consents', label: 'Zgody' },
];

interface Props {
    customer: Customer;
    tags: CustomerTag[];
    onClose?: () => void;
    onUpdate?: (data: Partial<Customer>) => Promise<void> | void;
}

export default function CustomerCard({
    customer,
    tags,
    onClose,
    onUpdate,
}: Props) {
    const [activeTab, setActiveTab] = useState<TabId>('summary');

    const initials = customer.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const genderDisplay =
        customer.gender === 'female'
            ? 'Kobieta'
            : customer.gender === 'male'
              ? 'Mężczyzna'
              : customer.gender
                ? 'Inna'
                : null;

    return (
        <div className="inner">
            {/* Breadcrumbs */}
            <div className="row">
                <div className="col-sm-12">
                    <ul className="versum-breadcrumb">
                        <li>
                            <Link href="/clients">KLIENCI</Link>
                        </li>
                        <li className="active">
                            {customer.firstName} {customer.lastName}
                        </li>
                    </ul>
                </div>
            </div>

            <div className="row">
                <div className="col-sm-12">
                    <div className="versum-widget p-0 overflow-hidden">
                        {/* Header */}
                        <div className="customer-header">
                            <div className="customer-header__avatar">
                                {initials}
                            </div>
                            <div className="customer-header__info">
                                <h2>
                                    {customer.firstName} {customer.lastName}
                                </h2>
                                <div className="customer-header__meta">
                                    <span>#{customer.id}</span>
                                    {customer.phone && (
                                        <>
                                            <span className="mx-8">|</span>
                                            <span>{customer.phone}</span>
                                        </>
                                    )}
                                    {customer.email && (
                                        <>
                                            <span className="mx-8">|</span>
                                            <span>{customer.email}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="text-right ml-auto">
                                <div className="btn-group">
                                    <button
                                        className="btn btn-default btn-sm"
                                        onClick={onClose}
                                    >
                                        <i className="fa fa-arrow-left mr-6"></i>
                                        Wróć
                                    </button>
                                    <button className="btn btn-default btn-sm ml-8">
                                        <i className="fa fa-pencil mr-6"></i>
                                        Edytuj
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="px-20">
                            <ul className="nav nav-tabs mt-20">
                                {tabs.map((tab) => (
                                    <li
                                        key={tab.id}
                                        className={
                                            activeTab === tab.id ? 'active' : ''
                                        }
                                    >
                                        <a onClick={() => setActiveTab(tab.id)}>
                                            {tab.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Tab Content */}
                        <div className="px-20 pb-20">
                            {activeTab === 'summary' && (
                                <CustomerSummaryTab customer={customer} />
                            )}
                            {activeTab === 'personal' && (
                                <CustomerPersonalDataTab
                                    customer={customer}
                                    onUpdate={onUpdate}
                                />
                            )}
                            {activeTab === 'statistics' && (
                                <CustomerStatisticsTab
                                    customerId={customer.id}
                                />
                            )}
                            {activeTab === 'history' && (
                                <CustomerHistoryTab customerId={customer.id} />
                            )}
                            {activeTab === 'notes' && (
                                <CustomerNotesTab customerId={customer.id} />
                            )}
                            {activeTab === 'gallery' && (
                                <CustomerGalleryTab customerId={customer.id} />
                            )}
                            {activeTab === 'files' && (
                                <CustomerFilesTab customerId={customer.id} />
                            )}
                            {activeTab === 'reviews' && (
                                <CustomerReviewsTab customerId={customer.id} />
                            )}
                            {activeTab === 'consents' && (
                                <CustomerConsentsTab
                                    customer={customer}
                                    onUpdate={onUpdate}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
