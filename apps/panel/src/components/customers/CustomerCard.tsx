'use client';

import { useState } from 'react';
import { Customer, CustomerTag } from '@/types';
import CustomerSummaryTab from './CustomerSummaryTab';
import CustomerPersonalDataTab from './CustomerPersonalDataTab';
import CustomerStatisticsTab from './CustomerStatisticsTab';
import CustomerHistoryTab from './CustomerHistoryTab';
import CustomerNotesTab from './CustomerNotesTab';
import CustomerConsentsTab from './CustomerConsentsTab';

type TabId =
    | 'summary'
    | 'personal'
    | 'statistics'
    | 'history'
    | 'notes'
    | 'consents';

const tabs: { id: TabId; label: string }[] = [
    { id: 'summary', label: 'Podsumowanie' },
    { id: 'personal', label: 'Dane osobowe' },
    { id: 'statistics', label: 'Statystyki' },
    { id: 'history', label: 'Historia' },
    { id: 'notes', label: 'Notatki' },
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
        <div className="flex h-full flex-col bg-white">
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-cyan-600 to-cyan-700 p-6 text-white">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-semibold">
                            {initials}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">
                                {customer.name}
                            </h2>
                            {customer.phone && (
                                <p className="text-cyan-100">
                                    {customer.phone}
                                </p>
                            )}
                            {customer.email && (
                                <p className="text-sm text-cyan-200">
                                    {customer.email}
                                </p>
                            )}
                        </div>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="rounded p-1 hover:bg-white/10"
                            aria-label="Zamknij"
                        >
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Quick info */}
                <div className="mt-4 flex gap-4 text-sm text-cyan-100">
                    {genderDisplay && <span>{genderDisplay}</span>}
                    {customer.city && <span>📍 {customer.city}</span>}
                    {customer.birthDate && (
                        <span>
                            🎂{' '}
                            {new Date(customer.birthDate).toLocaleDateString(
                                'pl-PL',
                            )}
                        </span>
                    )}
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                        {tags.map((tag) => (
                            <span
                                key={tag.id}
                                className="rounded px-2 py-0.5 text-xs"
                                style={{
                                    backgroundColor: tag.color || '#e5e7eb',
                                    color: tag.color ? '#fff' : '#374151',
                                }}
                            >
                                {tag.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b">
                <nav className="flex overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'border-cyan-600 text-cyan-600'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
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
                    <CustomerStatisticsTab customerId={customer.id} />
                )}
                {activeTab === 'history' && (
                    <CustomerHistoryTab customerId={customer.id} />
                )}
                {activeTab === 'notes' && (
                    <CustomerNotesTab customerId={customer.id} />
                )}
                {activeTab === 'consents' && (
                    <CustomerConsentsTab
                        customer={customer}
                        onUpdate={onUpdate}
                    />
                )}
            </div>
        </div>
    );
}
