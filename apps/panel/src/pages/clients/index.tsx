'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import {
    useCreateCustomer,
    useCreateCustomerGroup,
    useCustomers,
    useCustomerGroups,
    useCustomerTags,
} from '@/hooks/useCustomers';
import type { CustomerFilterParams, Customer } from '@/types';

type CustomerDraft = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
};

type GroupDraft = {
    name: string;
    description: string;
    color: string;
};

type SortOption = 'name_asc' | 'name_desc' | 'created_desc' | 'created_asc';

const QUICK_GROUPS = [
    { id: 'all', label: 'wszyscy klienci', icon: '👥' },
    { id: 'today', label: 'Umówieni na dzisiaj', icon: '📅' },
    { id: 'recent', label: 'Ostatnio dodani', icon: '🆕' },
    { id: 'no_online', label: 'Nie rezerwują online', icon: '🚫' },
] as const;

const FILTER_CRITERIA = [
    { id: 'used_services', label: 'skorzystali z usług', icon: '✂️' },
    { id: 'has_visit', label: 'mają wizytę w salonie', icon: '📋' },
    { id: 'by_employee', label: 'obsługiwani przez pracowników', icon: '👤' },
] as const;

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
    const [activeQuickGroup, setActiveQuickGroup] = useState<string>('all');
    const [showMoreGroups, setShowMoreGroups] = useState(false);
    const [showMoreCriteria, setShowMoreCriteria] = useState(false);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

    const createCustomer = useCreateCustomer();
    const createGroup = useCreateCustomerGroup();
    const { data: groups } = useCustomerGroups();
    const { data: tags } = useCustomerTags();

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

    const handleQuickGroupClick = (groupId: string) => {
        setActiveQuickGroup(groupId);
        // Reset filters based on group
        if (groupId === 'all') {
            setFilters((prev) => ({ ...prev, groupId: undefined, page: 1 }));
        }
        // Other quick groups would need backend support
    };

    const handleGroupClick = (groupId: number) => {
        setFilters((prev) => ({ ...prev, groupId, page: 1 }));
        setActiveQuickGroup('');
    };

    return (
        <RouteGuard
            roles={['admin', 'employee', 'receptionist']}
            permission="nav:clients"
        >
            <DashboardLayout>
                <div className="flex h-full" data-testid="clients-page">
                    {/* Left Sidebar */}
                    <aside className="w-56 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50">
                        {/* Customer Groups */}
                        <div className="p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Grupy klientów
                                </h4>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowCreateGroupModal(true)
                                    }
                                    className="text-xs text-cyan-600 hover:text-cyan-700"
                                    title="Dodaj grupę"
                                >
                                    + dodaj
                                </button>
                            </div>
                            <ul className="space-y-1">
                                {QUICK_GROUPS.map((group) => (
                                    <li key={group.id}>
                                        <button
                                            onClick={() =>
                                                handleQuickGroupClick(group.id)
                                            }
                                            className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors ${
                                                activeQuickGroup === group.id
                                                    ? 'bg-cyan-100 font-medium text-cyan-700'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <span className="text-base">
                                                {group.icon}
                                            </span>
                                            {group.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            {/* Custom Groups */}
                            {groups && groups.length > 0 && (
                                <ul className="mt-2 space-y-1 border-t border-gray-200 pt-2">
                                    {(showMoreGroups
                                        ? groups
                                        : groups.slice(0, 3)
                                    ).map((group) => (
                                        <li key={group.id}>
                                            <button
                                                onClick={() =>
                                                    handleGroupClick(group.id)
                                                }
                                                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors ${
                                                    filters.groupId === group.id
                                                        ? 'bg-cyan-100 font-medium text-cyan-700'
                                                        : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                            >
                                                {group.color && (
                                                    <span
                                                        className="h-2 w-2 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                group.color,
                                                        }}
                                                    />
                                                )}
                                                <span className="flex-1 truncate">
                                                    {group.name}
                                                </span>
                                                {group.memberCount !==
                                                    undefined && (
                                                    <span className="text-xs text-gray-400">
                                                        {group.memberCount}
                                                    </span>
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                    {groups.length > 3 && (
                                        <li>
                                            <button
                                                onClick={() =>
                                                    setShowMoreGroups(
                                                        !showMoreGroups,
                                                    )
                                                }
                                                className="flex items-center gap-1 px-2 py-1 text-sm text-cyan-600 hover:text-cyan-700"
                                            >
                                                <span>+</span>
                                                {showMoreGroups
                                                    ? 'mniej'
                                                    : 'więcej'}
                                            </button>
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>

                        {/* Filter Criteria */}
                        <div className="border-t border-gray-200 p-4">
                            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Wybierz kryteria
                            </h4>
                            <ul className="space-y-1">
                                {(showMoreCriteria
                                    ? FILTER_CRITERIA
                                    : FILTER_CRITERIA.slice(0, 3)
                                ).map((criterion) => (
                                    <li key={criterion.id}>
                                        <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100">
                                            <span className="text-base">
                                                {criterion.icon}
                                            </span>
                                            {criterion.label}
                                        </button>
                                    </li>
                                ))}
                                <li>
                                    <button
                                        onClick={() =>
                                            setShowMoreCriteria(
                                                !showMoreCriteria,
                                            )
                                        }
                                        className="flex items-center gap-1 px-2 py-1 text-sm text-cyan-600 hover:text-cyan-700"
                                    >
                                        <span>+</span>
                                        {showMoreCriteria ? 'mniej' : 'więcej'}
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Tags */}
                        {tags && tags.length > 0 && (
                            <div className="border-t border-gray-200 p-4">
                                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Tagi
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                    {tags.slice(0, 10).map((tag) => (
                                        <button
                                            key={tag.id}
                                            onClick={() =>
                                                setFilters((prev) => ({
                                                    ...prev,
                                                    tagId:
                                                        prev.tagId === tag.id
                                                            ? undefined
                                                            : tag.id,
                                                    page: 1,
                                                }))
                                            }
                                            className={`rounded px-2 py-0.5 text-xs transition-colors ${
                                                filters.tagId === tag.id
                                                    ? 'bg-cyan-600 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                            style={
                                                tag.color &&
                                                filters.tagId !== tag.id
                                                    ? {
                                                          backgroundColor:
                                                              tag.color,
                                                          color: '#fff',
                                                      }
                                                    : undefined
                                            }
                                        >
                                            {tag.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>

                    {/* Main Content */}
                    <main className="flex flex-1 flex-col overflow-hidden">
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
                                />
                                <select
                                    className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                    value={sortOption}
                                    onChange={(e) =>
                                        setSortOption(
                                            e.target.value as SortOption,
                                        )
                                    }
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
                                            />
                                            zaznacz wszystkich (
                                            {selectedIds.size})
                                        </label>
                                    </div>

                                    {/* Customer List */}
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {customerRows.map((customer) => (
                                                <tr
                                                    key={customer.id}
                                                    className="cursor-pointer hover:bg-gray-50"
                                                    onClick={() =>
                                                        handleRowClick(customer)
                                                    }
                                                >
                                                    <td
                                                        className="w-10 px-4 py-3"
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
                                                    <td className="px-4 py-3">
                                                        <span className="font-medium text-cyan-600 hover:text-cyan-700">
                                                            {customer.name}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500">
                                                        {customer.email ? (
                                                            <a
                                                                href={`mailto:${customer.email}`}
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                                className="text-gray-400 hover:text-cyan-600"
                                                                title={
                                                                    customer.email
                                                                }
                                                            >
                                                                ✉️
                                                            </a>
                                                        ) : (
                                                            <span
                                                                className="text-gray-300"
                                                                title="brak email"
                                                            >
                                                                ✉️
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {customer.phone ? (
                                                            <a
                                                                href={`tel:${customer.phone}`}
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                                className="text-gray-600 hover:text-cyan-600"
                                                            >
                                                                📞{' '}
                                                                {customer.phone}
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-400">
                                                                📞 nie podano
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">
                                                        📅{' '}
                                                        {formatShortDate(
                                                            customer.createdAt,
                                                        )}
                                                    </td>
                                                    <td
                                                        className="w-10 px-4 py-3"
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
                        onCreate={async (payload) => {
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

                {/* Create Group Modal */}
                {showCreateGroupModal && (
                    <CreateGroupModal
                        onClose={() => setShowCreateGroupModal(false)}
                        onCreate={async (payload) => {
                            await createGroup.mutateAsync(payload);
                            setShowCreateGroupModal(false);
                        }}
                        submitting={createGroup.isPending}
                    />
                )}
            </DashboardLayout>
        </RouteGuard>
    );
}

function CreateCustomerModal({
    onClose,
    onCreate,
    submitting,
}: {
    onClose: () => void;
    onCreate: (payload: CustomerDraft) => Promise<void>;
    submitting: boolean;
}) {
    const [form, setForm] = useState<CustomerDraft>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
    });

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await onCreate(form);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form
                className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl"
                onSubmit={(event) => {
                    void handleSubmit(event);
                }}
            >
                <h2 className="mb-4 text-lg font-semibold text-gray-800">
                    👤 Dodaj klienta
                </h2>
                <div className="grid gap-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Imię
                        </label>
                        <input
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            value={form.firstName}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    firstName: event.target.value,
                                }))
                            }
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Nazwisko
                        </label>
                        <input
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            value={form.lastName}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    lastName: event.target.value,
                                }))
                            }
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            type="email"
                            value={form.email}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    email: event.target.value,
                                }))
                            }
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Telefon
                        </label>
                        <input
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            value={form.phone}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    phone: event.target.value,
                                }))
                            }
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        onClick={onClose}
                    >
                        Anuluj
                    </button>
                    <button
                        type="submit"
                        className="rounded bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
                        disabled={submitting}
                    >
                        {submitting ? 'Zapisywanie...' : 'Zapisz'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function CreateGroupModal({
    onClose,
    onCreate,
    submitting,
}: {
    onClose: () => void;
    onCreate: (payload: GroupDraft) => Promise<void>;
    submitting: boolean;
}) {
    const [form, setForm] = useState<GroupDraft>({
        name: '',
        description: '',
        color: '#06b6d4',
    });

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await onCreate(form);
    };

    const colorOptions = [
        '#06b6d4', // cyan
        '#10b981', // green
        '#f59e0b', // amber
        '#ef4444', // red
        '#8b5cf6', // purple
        '#ec4899', // pink
        '#6366f1', // indigo
        '#64748b', // slate
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form
                className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl"
                onSubmit={(event) => {
                    void handleSubmit(event);
                }}
            >
                <h2 className="mb-4 text-lg font-semibold text-gray-800">
                    Nowa grupa klientów
                </h2>
                <div className="grid gap-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Nazwa grupy
                        </label>
                        <input
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            value={form.name}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    name: event.target.value,
                                }))
                            }
                            placeholder="np. VIP, Stali klienci"
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Opis (opcjonalnie)
                        </label>
                        <textarea
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            value={form.description}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    description: event.target.value,
                                }))
                            }
                            placeholder="Krótki opis grupy"
                            rows={2}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Kolor
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {colorOptions.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() =>
                                        setForm((prev) => ({ ...prev, color }))
                                    }
                                    className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                                        form.color === color
                                            ? 'border-gray-800 ring-2 ring-gray-300'
                                            : 'border-transparent'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        onClick={onClose}
                    >
                        Anuluj
                    </button>
                    <button
                        type="submit"
                        className="rounded bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
                        disabled={submitting || !form.name.trim()}
                    >
                        {submitting ? 'Zapisywanie...' : 'Utwórz grupę'}
                    </button>
                </div>
            </form>
        </div>
    );
}
