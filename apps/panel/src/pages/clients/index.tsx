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
            <DashboardLayout pageTitle="Klienci">
                <div className="versum-page" data-testid="clients-page">
                    <header className="versum-page__header">
                        <h1 className="versum-page__title">Klienci</h1>
                    </header>

                    <div className="versum-page__toolbar">
                        <input
                            className="form-control versum-toolbar-search"
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
                            className="form-control versum-toolbar-select"
                            value={sortOption}
                            onChange={(e) =>
                                setSortOption(e.target.value as SortOption)
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
                            className="btn btn-primary versum-toolbar-btn"
                            onClick={() => setShowCreateModal(true)}
                        >
                            dodaj klienta
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="p-4 text-sm versum-muted">
                            Ładowanie klientów...
                        </div>
                    ) : (
                        <>
                            <div className="versum-table-wrap">
                                <div className="versum-table-header-alt">
                                    <label
                                        className="checkbox-inline"
                                        style={{
                                            fontSize: '11px',
                                            margin: 0,
                                            cursor: 'pointer',
                                        }}
                                    >
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
                                        />
                                        &nbsp; zaznacz wszystkich (
                                        {selectedIds.size})
                                    </label>
                                </div>
                                <table className="versum-table">
                                    <thead>
                                        <tr>
                                            <th className="w-8"></th>
                                            <th>Klient</th>
                                            <th>Telefon</th>
                                            <th>Ostatnia wizyta</th>
                                            <th className="w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customerRows.length > 0 ? (
                                            customerRows.map((customer) => (
                                                <tr
                                                    key={customer.id}
                                                    className="cursor-pointer"
                                                    onClick={() =>
                                                        handleRowClick(customer)
                                                    }
                                                >
                                                    <td
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
                                                        />
                                                    </td>
                                                    <td>
                                                        <Link
                                                            href={
                                                                `/clients/${customer.id}` as Route
                                                            }
                                                            className="versum-link"
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            {customer.name}
                                                        </Link>
                                                    </td>
                                                    <td>
                                                        {customer.phone ? (
                                                            <a
                                                                href={`tel:${customer.phone}`}
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                                className="hover:text-sky-600"
                                                            >
                                                                {customer.phone}
                                                            </a>
                                                        ) : (
                                                            <span className="versum-muted">
                                                                nie podano
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {formatShortDate(
                                                            customer.createdAt,
                                                        )}
                                                    </td>
                                                    <td
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <Link
                                                            href={
                                                                `/clients/${customer.id}/edit` as Route
                                                            }
                                                            className="versum-muted hover:text-sky-600"
                                                            prefetch={false}
                                                        >
                                                            ✏️
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="p-4 text-center versum-muted"
                                                >
                                                    Brak klientów spełniających
                                                    kryteria
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="versum-pagination-footer">
                                <span>
                                    Pozycje od{' '}
                                    {Math.min((page - 1) * limit + 1, total)} do{' '}
                                    {Math.min(page * limit, total)} z {total} |
                                    na stronie{' '}
                                    <select
                                        className="form-control"
                                        value={limit}
                                        onChange={(e) =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                limit: Number(e.target.value),
                                                page: 1,
                                            }))
                                        }
                                    >
                                        <option value="10">10</option>
                                        <option value="20">20</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        className="btn btn-default btn-xs"
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
                                        className="btn btn-default btn-xs"
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
                        </>
                    )}
                </div>

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
