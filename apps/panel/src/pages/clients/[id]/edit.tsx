'use client';

import { useRouter } from 'next/router';
import Link from 'next/link';
import type { Route } from 'next';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import type { Customer } from '@/types';
import CustomerPersonalDataTab from '@/components/customers/CustomerPersonalDataTab';

export default function CustomerEditPage() {
    const router = useRouter();
    const { role } = useAuth();
    const { id } = router.query;
    const customerId = id ? Number(id) : null;

    const { data: customer, isLoading, error } = useCustomer(customerId);
    const updateCustomer = useUpdateCustomer();

    if (!role) return null;

    const handleUpdate = async (data: Partial<Customer>) => {
        if (!customerId) return;
        await updateCustomer.mutateAsync({ id: customerId, data });
    };

    return (
        <RouteGuard
            roles={['admin', 'employee', 'receptionist']}
            permission="nav:clients"
        >
            <VersumShell role={role}>
                <div className="versum-page" data-testid="customer-edit-page">
                    <header className="versum-page__header">
                        <h1 className="versum-page__title">Edycja klienta</h1>
                        {customerId && (
                            <Link
                                href={`/clients/${customerId}` as Route}
                                className="versum-btn versum-btn--light"
                            >
                                Wróć do karty klienta
                            </Link>
                        )}
                    </header>

                    {isLoading ? (
                        <div className="p-4 text-sm versum-muted">
                            Ładowanie...
                        </div>
                    ) : error ? (
                        <div className="p-4 text-sm text-red-700">
                            Nie udało się załadować klienta.
                        </div>
                    ) : customer ? (
                        <div className="inner">
                            <CustomerPersonalDataTab
                                customer={customer}
                                onUpdate={handleUpdate}
                            />
                        </div>
                    ) : (
                        <div className="p-4 text-sm versum-muted">
                            Nie znaleziono klienta.
                        </div>
                    )}
                </div>
            </VersumShell>
        </RouteGuard>
    );
}
