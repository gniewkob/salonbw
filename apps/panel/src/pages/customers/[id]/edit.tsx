'use client';

import { useRouter } from 'next/router';
import Link from 'next/link';
import type { Route } from 'next';
import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import VersumCustomersVendorCss from '@/components/versum/VersumCustomersVendorCss';
import NewCustomerNav from '@/components/versum/navs/NewCustomerNav';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import type { Customer } from '@/types';
import CustomerPersonalDataTab from '@/components/customers/CustomerPersonalDataTab';

type EditTab = 'basic' | 'extended' | 'advanced';

function parseNumericIdParam(
    value: string | string[] | undefined,
): number | null {
    if (!value) return null;
    const raw = Array.isArray(value) ? value[0] : value;
    const n = Number(raw);
    return Number.isInteger(n) && n > 0 ? n : null;
}

export default function CustomerEditPage() {
    const router = useRouter();
    const { role } = useAuth();
    const { id } = router.query;
    const customerId = router.isReady ? parseNumericIdParam(id) : null;
    const [activeTab, setActiveTab] = useState<EditTab>('basic');

    const { data: customer, isLoading, error } = useCustomer(customerId);
    const updateCustomer = useUpdateCustomer();

    if (!role) return null;

    const handleUpdate = async (data: Partial<Customer>) => {
        if (!customerId) return;
        await updateCustomer.mutateAsync({ id: customerId, data });
    };

    const handleSelectTab = (tab: EditTab) => {
        setActiveTab(tab);
        const idMap: Record<EditTab, string> = {
            basic: 'customer-personal-first-name',
            extended: 'customer-personal-birth-date',
            advanced: 'customer-personal-email-consent',
        };
        const target = document.getElementById(idMap[tab]);
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const secondNav = (
        <div className="sidenav secondarynav" id="sidenav">
            <NewCustomerNav
                title="EDYCJA KLIENTA"
                activeTab={activeTab}
                onSelect={handleSelectTab}
            />
        </div>
    );

    return (
        <RouteGuard
            roles={['admin', 'employee', 'receptionist']}
            permission="nav:customers"
        >
            <VersumShell role={role} secondaryNav={secondNav}>
                <VersumCustomersVendorCss />
                <div className="show_customer" id="customers_main">
                    <ul className="breadcrumb">
                        <li>
                            Klienci / {customer?.name || '...'} / dane osobowe
                        </li>
                    </ul>

                    {isLoading ? (
                        <div className="customer-loading">Ładowanie...</div>
                    ) : error ? (
                        <div className="customer-error">
                            Nie udało się załadować klienta.
                        </div>
                    ) : customer ? (
                        <>
                            <div className="customer-actions-bar">
                                <div className="customer-actions-bar__spacer" />
                                <Link
                                    href={`/customers/${customer.id}` as Route}
                                    className="btn btn-default btn-xs"
                                >
                                    wróć do karty klienta
                                </Link>
                            </div>
                            <CustomerPersonalDataTab
                                customer={customer}
                                onUpdate={handleUpdate}
                            />
                        </>
                    ) : (
                        <div className="customer-error">
                            Nie znaleziono klienta.
                        </div>
                    )}
                </div>
            </VersumShell>
        </RouteGuard>
    );
}
