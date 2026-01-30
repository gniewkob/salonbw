'use client';

import { useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import RouteGuard from '@/components/RouteGuard';
import SuppliersTab from '@/components/warehouse/SuppliersTab';
import DeliveriesTab from '@/components/warehouse/DeliveriesTab';
import StocktakingTab from '@/components/warehouse/StocktakingTab';
import StockAlertsTab from '@/components/warehouse/StockAlertsTab';

type TabId = 'alerts' | 'suppliers' | 'deliveries' | 'stocktaking';

const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'alerts', label: 'Alerty' },
    { id: 'suppliers', label: 'Dostawcy' },
    { id: 'deliveries', label: 'Dostawy' },
    { id: 'stocktaking', label: 'Inwentaryzacja' },
];

export default function WarehousePage() {
    const [activeTab, setActiveTab] = useState<TabId>('alerts');

    return (
        <RouteGuard roles={['admin']} permission="nav:warehouse">
            <Head>
                <title>Magazyn | SalonBW</title>
            </Head>
            <DashboardLayout>
                <div className="p-6">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Magazyn</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Alerty stanów, dostawcy, dostawy i inwentaryzacja
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-6">
                        <nav className="-mb-px flex space-x-8">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                                        ${
                                            activeTab === tab.id
                                                ? 'border-teal-500 text-teal-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }
                                    `}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'alerts' && <StockAlertsTab />}
                    {activeTab === 'suppliers' && <SuppliersTab />}
                    {activeTab === 'deliveries' && <DeliveriesTab />}
                    {activeTab === 'stocktaking' && <StocktakingTab />}
                </div>
            </DashboardLayout>
        </RouteGuard>
    );
}
