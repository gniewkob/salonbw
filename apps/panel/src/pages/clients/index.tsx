'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { useCreateCustomer, useCustomers } from '@/hooks/useCustomers';
import type { CustomerFilterParams, Customer } from '@/types';
import CreateCustomerModal, {
    type CustomerDraft,
} from '@/components/versum/modals/CreateCustomerModal';

type SortOption = 'name_asc' | 'name_desc' | 'created_desc' | 'created_asc';

function formatShortDate(value: string | undefined) {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch {
        return '-';
    }
}

export default function ClientsPage() {
    return <ClientsPageContent />;
}

function ClientsPageContent() {
    const router = useRouter();
    const [filters, setFilters] = useState<CustomerFilterParams>({
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'ASC',
    });
    const [search, setSearch] = useState('');
    const [sortOption, setSortOption] = useState<SortOption>('name_asc');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const createCustomer = useCreateCustomer();

    // Sync filters from URL from ClientsNav
    useEffect(() => {
        if (!router.isReady) return;

        setFilters((prev) => {
            const newGroupId = router.query.groupId
                ? Number(router.query.groupId)
                : undefined;
            const newTagId = router.query.tagId
                ? Number(router.query.tagId)
                : undefined;
            const newServiceId = router.query.serviceId
                ? Number(router.query.serviceId)
                : undefined;
            const newEmployeeId = router.query.employeeId
                ? Number(router.query.employeeId)
                : undefined;
            const newHasVisit = router.query.hasUpcomingVisit === 'true';

            if (
                prev.groupId === newGroupId &&
                prev.tagId === newTagId &&
                prev.serviceId === newServiceId &&
                prev.employeeId === newEmployeeId &&
                prev.hasUpcomingVisit === newHasVisit
            )
                return prev;

            return {
                ...prev,
                groupId: newGroupId,
                tagId: newTagId,
                serviceId: newServiceId,
                employeeId: newEmployeeId,
                hasUpcomingVisit: newHasVisit || undefined,
                page: 1, // Reset page on filter change
            };
        });
    }, [
        router.isReady,
        router.query.groupId,
        router.query.tagId,
        router.query.serviceId,
        router.query.employeeId,
        router.query.hasUpcomingVisit,
    ]);

    const queryFilters = useMemo(() => {
        const [sortBy, sortOrder] = {
            name_asc: ['name', 'ASC'],
            name_desc: ['name', 'DESC'],
            created_desc: ['createdAt', 'DESC'],
            created_asc: ['createdAt', 'ASC'],
        }[sortOption] as [string, 'ASC' | 'DESC'];

        return {
            ...filters,
            search: search || undefined,
            sortBy,
            sortOrder,
        };
    }, [filters, search, sortOption]);

    const { data, isLoading } = useCustomers(queryFilters);

    const customerRows = useMemo(() => data?.items ?? [], [data?.items]);
    const totalPages = data?.totalPages ?? 1;
    const total = data?.total ?? 0;
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(customerRows.map((c) => c.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        const newSet = new Set(selectedIds);
        if (checked) {
            newSet.add(id);
        } else {
            newSet.delete(id);
        }
        setSelectedIds(newSet);
    };

    const handleRowClick = (customer: Customer) => {
        void router.push(`/clients/${customer.id}` as Route);
    };

    return (
        <RouteGuard
            roles={['admin', 'employee', 'receptionist']}
            permission="nav:clients"
        >
            <DashboardLayout>
                <div className="flex h-full" data-testid="clients-page">
                    {/* Left Sidebar logic moved to ClientsNav via DashboardLayout */}

                    {/* Main Content */}
                    <main className="flex-1 overflow-auto bg-gray-50 p-6">
                        {/* Header */}
                        <header className="border-b border-gray-200 bg-white px-6 py-4">
                            <nav className="mb-3 flex items-center gap-2 text-sm text-gray-500">
                                <span className="font-medium text-gray-700">
                                    👥 Klienci
                                </span>
                                <span>/</span>
                                <span>Lista klientów</span>
                            </nav>

                            {/* Toolbar */}
                            <div className="flex items-center gap-4">
                                <input
                                    type="text"
                                    className="w-64 rounded border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setFilters((prev) => ({
                                            ...prev,
                                            page: 1,
                                        }));
                                    }}
                                    placeholder="wyszukaj klienta"
                                    aria-label="Wyszukaj klienta"
                                />
                                <select
                                    className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                    value={sortOption}
                                    onChange={(e) =>
                                        setSortOption(
                                            e.target.value as SortOption,
                                        )
                                    }
                                    aria-label="Sortowanie klientów"
                                >
                                    <option value="name_asc">
                                        nazwisko: od A do Z
                                    </option>
                                    <option value="name_desc">
                                        nazwisko: od Z do A
                                    </option>
                                    <option value="created_desc">
                                        data dodania: najnowsi
                                    </option>
                                    <option value="created_asc">
                                        data dodania: najstarsi
                                    </option>
                                </select>
                                <button
                                    type="button"
                                    className="ml-auto rounded bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    👤 Dodaj klienta
                                </button>
                            </div>
                        </header>

                        {/* Table */}
                        <div className="flex-1 overflow-auto">
                            {isLoading ? (
                                <div className="flex h-full items-center justify-center text-gray-500">
                                    Ładowanie klientów...
                                </div>
                            ) : (
                                <div className="min-w-full">
                                    {/* Select All */}
                                    <div className="border-b border-gray-200 bg-gray-50 px-6 py-2">
                                        <label className="flex items-center gap-2 text-sm text-gray-600">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    customerRows.length > 0 &&
                                                    selectedIds.size ===
                                                        customerRows.length
                                                }
                                                onChange={(e) =>
                                                    handleSelectAll(
                                                        e.target.checked,
                                                    )
                                                }
                                                className="rounded border-gray-300"
                                                aria-label="Zaznacz wszystkich klientów"
                                            />
                                            zaznacz wszystkich (
                                            {selectedIds.size})
                                        </label>
                                    </div>

                                    {/* Customer List */}
                                    <table className="versum-table">
                                        <thead>
                                            <tr>
                                                <th className="w-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            customerRows.length >
                                                                0 &&
                                                            selectedIds.size ===
                                                                customerRows.length
                                                        }
                                                        onChange={(e) =>
                                                            handleSelectAll(
                                                                e.target
                                                                    .checked,
                                                            )
                                                        }
                                                        className="rounded border-gray-300"
                                                        aria-label="Zaznacz wszystkich klientów na stronie"
                                                    />
                                                </th>
                                                <th>Klient</th>
                                                <th>Email</th>
                                                <th>Telefon</th>
                                                <th>W systemie od</th>
                                                <th className="w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customerRows.map((customer) => (
                                                <tr
                                                    key={customer.id}
                                                    className="cursor-pointer hover:bg-cyan-50"
                                                    onClick={() =>
                                                        handleRowClick(customer)
                                                    }
                                                >
                                                    <td
                                                        className="w-10"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.has(
                                                                customer.id,
                                                            )}
                                                            onChange={(e) =>
                                                                handleSelectOne(
                                                                    customer.id,
                                                                    e.target
                                                                        .checked,
                                                                )
                                                            }
                                                            className="rounded border-gray-300"
                                                            aria-label={`Zaznacz klienta ${customer.name}`}
                                                        />
                                                    </td>
                                                    <td>
                                                        <span className="font-semibold text-cyan-600 hover:underline">
                                                            {customer.name}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {customer.email ? (
                                                            <a
                                                                href={`mailto:${customer.email}`}
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                                className="text-gray-600 hover:text-cyan-600"
                                                            >
                                                                {customer.email}
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-300">
                                                                -
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {customer.phone ? (
                                                            <a
                                                                href={`tel:${customer.phone}`}
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                                className="text-gray-600 hover:text-cyan-600"
                                                            >
                                                                {customer.phone}
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-300">
                                                                -
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {formatShortDate(
                                                            customer.createdAt,
                                                        )}
                                                    </td>
                                                    <td
                                                        className="w-10"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <Link
                                                            href={
                                                                `/clients/${customer.id}/edit` as Route
                                                            }
                                                            className="text-gray-400 hover:text-cyan-600"
                                                            prefetch={false}
                                                            aria-label={`Edytuj klienta ${customer.name}`}
                                                        >
                                                            ✏️
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3 text-sm">
                            <span className="text-gray-600">
                                Pozycje od{' '}
                                {Math.min((page - 1) * limit + 1, total)} do{' '}
                                {Math.min(page * limit, total)} z {total} | na
                                stronie{' '}
                                <select
                                    className="ml-1 rounded border border-gray-300 px-2 py-1 text-sm"
                                    value={limit}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            limit: Number(e.target.value),
                                            page: 1,
                                        }))
                                    }
                                    aria-label="Liczba pozycji na stronę"
                                >
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className="rounded border border-gray-300 px-3 py-1 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={page <= 1}
                                    onClick={() =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            page: Math.max(
                                                (prev.page ?? 1) - 1,
                                                1,
                                            ),
                                        }))
                                    }
                                >
                                    ‹
                                </button>
                                <span className="px-2">
                                    {page} z {totalPages}
                                </span>
                                <button
                                    type="button"
                                    className="rounded border border-gray-300 px-3 py-1 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={page >= totalPages}
                                    onClick={() =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            page: Math.min(
                                                (prev.page ?? 1) + 1,
                                                totalPages,
                                            ),
                                        }))
                                    }
                                >
                                    ›
                                </button>
                            </div>
                        </div>
                    </main>
                </div>

                {/* Create Customer Modal */}
                {showCreateModal && (
                    <CreateCustomerModal
                        onClose={() => setShowCreateModal(false)}
                        onCreate={async (payload: CustomerDraft) => {
                            const name =
                                `${payload.firstName} ${payload.lastName}`.trim();
                            await createCustomer.mutateAsync({
                                ...payload,
                                name,
                                smsConsent: true,
                                emailConsent: true,
                                gdprConsent: true,
                            });
                            setShowCreateModal(false);
                        }}
                        submitting={createCustomer.isPending}
                    />
                )}
            </DashboardLayout>
        </RouteGuard>
    );
}
