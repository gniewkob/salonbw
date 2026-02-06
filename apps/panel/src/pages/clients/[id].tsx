'use client';

import { useRouter } from 'next/router';
import Link from 'next/link';
import type { Route } from 'next';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { CustomerCard } from '@/components/customers';
import {
    useCustomer,
    useTagsForCustomer,
    useUpdateCustomer,
} from '@/hooks/useCustomers';
import type { Customer } from '@/types';

export default function CustomerDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const customerId = id ? Number(id) : null;

    const { data: customer, isLoading, error } = useCustomer(customerId);
    const { data: tags } = useTagsForCustomer(customerId);
    const updateCustomer = useUpdateCustomer();

    const handleUpdate = async (data: Partial<Customer>) => {
        if (!customerId) return;
        await updateCustomer.mutateAsync({ id: customerId, data });
    };

    const handleClose = () => {
        void router.push('/clients' as Route);
    };

    return (
        <RouteGuard
            roles={['admin', 'employee', 'receptionist']}
            permission="nav:clients"
        >
            <DashboardLayout>
                <div className="inner">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center text-gray-500 p-20">
                            Ładowanie danych klienta...
                        </div>
                    ) : error ? (
                        <div className="flex h-full flex-col items-center justify-center text-gray-500 p-20">
                            <p className="mb-4">
                                Nie udało się załadować danych klienta
                            </p>
                            <Link
                                href={'/clients' as Route}
                                className="btn btn-default"
                            >
                                Wróć do listy klientów
                            </Link>
                        </div>
                    ) : customer ? (
                        <CustomerCard
                            customer={customer}
                            tags={tags ?? []}
                            onClose={handleClose}
                            onUpdate={handleUpdate}
                        />
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center text-gray-500 p-20">
                            <p className="mb-4">Nie znaleziono klienta</p>
                            <Link
                                href={'/clients' as Route}
                                className="btn btn-default"
                            >
                                Wróć do listy klientów
                            </Link>
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </RouteGuard>
    );
}
