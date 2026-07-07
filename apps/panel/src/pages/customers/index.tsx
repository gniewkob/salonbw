import Head from 'next/head';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import NewCustomerModal from '@/components/customers/NewCustomerModal';
import EditCustomerModal from '@/components/customers/EditCustomerModal';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import {
    useCustomers,
    useCustomerGroups,
    useAddGroupMembers,
} from '@/hooks/useCustomers';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState, useMemo, useEffect, useRef } from 'react';
import type { CustomerFilterParams, Customer } from '@/types';
import {
    DndContext,
    DragOverlay,
    useDraggable,
    DragStartEvent,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { Route } from 'next';

function formatLastVisit(date: string | null | undefined) {
    if (!date) return '-';
    const value = new Date(date);
    if (!Number.isFinite(value.getTime())) return '-';

    const day = `${value.getDate()}`.padStart(2, '0');
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const year = value.getFullYear();
    const hours = `${value.getHours()}`.padStart(2, '0');
    const minutes = `${value.getMinutes()}`.padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function DraggableCustomerRow({
    customer,
    isDragging,
    isSelected,
    onToggleSelect,
    onOpen,
    onEdit,
    rowClass,
}: {
    customer: Customer;
    isDragging: boolean;
    isSelected: boolean;
    onToggleSelect: (id: number) => void;
    onOpen: (id: number) => void;
    onEdit: (id: number) => void;
    rowClass?: string;
}) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: customer.id,
    });

    const style = transform
        ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          }
        : undefined;

    return (
        <tr
            ref={setNodeRef}
            {...{ style }}
            className={`customer-row ${rowClass ?? ''} ${isDragging ? 'opacity-50' : ''} ${isSelected ? 'table-active' : ''}`.trim()}
            onClick={() => onOpen(customer.id)}
        >
            <td className="w-50p">
                <span className="checkbox_container">
                    <input
                        type="checkbox"
                        aria-label="Wybierz klienta"
                        checked={isSelected}
                        onChange={() => onToggleSelect(customer.id)}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                    />
                </span>
                <Link
                    href={`/customers/${customer.id}`}
                    className="row-title"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {customer.fullName || customer.name}
                </Link>
                <div className="d-block d-sm-none small text-muted mt-1">
                    {formatLastVisit(customer.lastVisitDate)}
                </div>
            </td>
            <td>
                {customer.phone ? (
                    <div className="inline_block">
                        <a
                            href={`tel:${customer.phone}`}
                            className="versum-phone-button"
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <div className="icon_box float-start">
                                <i
                                    className="icon sprite-customer_telephone"
                                    aria-hidden="true"
                                />
                            </div>
                            {customer.phone}
                        </a>
                    </div>
                ) : null}
                {customer.email ? (
                    <a
                        href={`/newsletters/new?platform=email&recipient=${encodeURIComponent(customer.email)}&single=1`}
                        className="d-none d-sm-inline"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <div
                            className="icon_box"
                            title={`wyślij email: ${customer.email}`}
                        >
                            <i
                                className="icon sprite-customer_email"
                                aria-hidden="true"
                            />
                        </div>
                    </a>
                ) : null}
            </td>
            <td className="d-none d-sm-table-cell">
                <div
                    className="icon_box"
                    title={
                        customer.lastVisitDate
                            ? `ostatnia wizyta: ${formatLastVisit(customer.lastVisitDate)}`
                            : 'brak wizyt'
                    }
                >
                    <i
                        className="icon sprite-settings_opening_hours"
                        aria-hidden="true"
                    />
                </div>
                <span>{formatLastVisit(customer.lastVisitDate)}</span>
            </td>
            <td
                className="text-end d-none d-sm-table-cell"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
            >
                <span
                    className="customers-drag-handle"
                    title="Przeciągnij do grupy"
                    {...listeners}
                    {...attributes}
                >
                    ⋮⋮
                </span>
                <Link
                    href={`/calendar?newClient=${customer.id}&clientName=${encodeURIComponent(customer.fullName ?? customer.name)}`}
                    className="btn btn-link"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    title="Umów wizytę"
                    aria-label="Umów wizytę"
                >
                    <i
                        className="icon sprite-add_appointment"
                        aria-hidden="true"
                    />
                </Link>
                <button
                    type="button"
                    className="btn btn-link"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(customer.id);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    title="Edytuj"
                    aria-label="Edytuj klienta"
                >
                    <i className="icon sprite-pencil" aria-hidden="true" />
                </button>
            </td>
        </tr>
    );
}

export default function ClientsPage() {
    const { role } = useAuth();
    const router = useRouter();
    const toast = useToast();

    const currentGroupId = router.query.groupId
        ? Number(router.query.groupId)
        : undefined;
    const currentTagId = router.query.tagId
        ? Number(router.query.tagId)
        : undefined;
    const currentServiceId = router.query.serviceId
        ? Number(router.query.serviceId)
        : undefined;
    const currentEmployeeId = router.query.employeeId
        ? Number(router.query.employeeId)
        : undefined;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [sortBy, setSortBy] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
    const [bulkGroupId, setBulkGroupId] = useState<string>('');
    const [bulkGroupPending, setBulkGroupPending] = useState(false);
    const [quickFilter, setQuickFilter] = useState<string>('');
    const [newCustomerOpen, setNewCustomerOpen] = useState(false);
    const [editCustomerId, setEditCustomerId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const [mobileAccumulated, setMobileAccumulated] = useState<Customer[]>([]);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 575px)');
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    useEffect(() => {
        setPage(1);
    }, [currentGroupId, currentTagId, currentServiceId, currentEmployeeId]);

    useEffect(() => {
        setSelectedIds(new Set());
    }, [page, pageSize]);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder((o) => (o === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSortBy(field);
            setSortOrder('ASC');
        }
        setPage(1);
    };

    const sortIndicator = (field: string) => {
        if (sortBy !== field) return ' ↕';
        return sortOrder === 'ASC' ? ' ↑' : ' ↓';
    };

    const filters: CustomerFilterParams = useMemo(
        () => ({
            groupId: currentGroupId,
            tagId: currentTagId,
            serviceId: currentServiceId,
            employeeId: currentEmployeeId,
            hasUpcomingVisit:
                router.query.hasUpcomingVisit === 'true'
                    ? true
                    : quickFilter === 'upcoming'
                      ? true
                      : undefined,
            noVisitSince:
                quickFilter === 'inactive6m'
                    ? new Date(
                          Date.now() - 180 * 24 * 60 * 60 * 1000,
                      ).toISOString()
                    : undefined,
            recentlyAdded: quickFilter === 'new' ? true : undefined,
            emailConsent: quickFilter === 'noEmailConsent' ? false : undefined,
            smsConsent: quickFilter === 'noSmsConsent' ? false : undefined,
            search: searchTerm.trim() || undefined,
            limit: pageSize,
            page,
            sortBy: sortBy || undefined,
            sortOrder: sortBy ? sortOrder : undefined,
        }),
        [
            currentGroupId,
            currentTagId,
            currentServiceId,
            currentEmployeeId,
            router.query.hasUpcomingVisit,
            page,
            pageSize,
            sortBy,
            sortOrder,
            quickFilter,
            searchTerm,
        ],
    );

    const { data: customersData, isLoading } = useCustomers(filters);
    const customers = useMemo(
        () => customersData?.items ?? [],
        [customersData],
    );
    const { data: groups } = useCustomerGroups();
    const addToGroup = useAddGroupMembers();
    const [draggedCustomer, setDraggedCustomer] = useState<Customer | null>(
        null,
    );
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
    );

    const activeGroup = groups?.find((g) => g.id === currentGroupId);

    const clearGroupFilter = () => {
        const restQuery = { ...router.query };
        delete restQuery.groupId;
        void router.push(
            { pathname: router.pathname, query: restQuery },
            undefined,
            { shallow: true },
        );
    };

    const filteredCustomers = customers;
    const displayedCustomers = isMobile ? mobileAccumulated : filteredCustomers;

    const allVisibleIds = displayedCustomers.map((c) => c.id);
    const allChecked =
        allVisibleIds.length > 0 &&
        allVisibleIds.every((id) => selectedIds.has(id));
    const someChecked =
        !allChecked && allVisibleIds.some((id) => selectedIds.has(id));

    const toggleSelectAll = () => {
        if (allChecked) {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                allVisibleIds.forEach((id) => next.delete(id));
                return next;
            });
        } else {
            setSelectedIds((prev) => new Set([...prev, ...allVisibleIds]));
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleBulkAddToGroup = async () => {
        if (!bulkGroupId || selectedIds.size === 0) return;
        setBulkGroupPending(true);
        try {
            await addToGroup.mutateAsync({
                groupId: Number(bulkGroupId),
                customerIds: [...selectedIds],
            });
            setSelectedIds(new Set());
            setBulkGroupId('');
            toast.success('Klienci dodani do grupy');
        } catch {
            toast.error('Nie udało się dodać klientów do grupy');
        } finally {
            setBulkGroupPending(false);
        }
    };

    const handleBulkNewsletter = () => {
        const ids = [...selectedIds].join(',');
        void router.push(`/newsletters/new?customerIds=${ids}`);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const customer = customers.find((c) => c.id === event.active.id);
        if (customer) {
            setDraggedCustomer(customer);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        void (async () => {
            const { active, over } = event;

            if (over && over.id !== active.id) {
                const groupId = Number(over.id);
                const customerId = Number(active.id);

                const group = groups?.find((g) => g.id === groupId);
                const customer = customers.find((c) => c.id === customerId);

                if (
                    group &&
                    customer &&
                    !customer.groups?.some((g) => g.id === groupId)
                ) {
                    try {
                        await addToGroup.mutateAsync({
                            groupId,
                            customerIds: [customerId],
                        });
                    } catch {
                        toast.error('Nie udało się dodać klienta do grupy');
                    }
                }
            }

            setDraggedCustomer(null);
        })();
    };

    const totalCount = customersData?.total ?? 0;
    const totalPages =
        customersData?.totalPages ?? (Math.ceil(totalCount / pageSize) || 1);
    const fromItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const toItem = Math.min(page * pageSize, totalCount);

    // Mobile infinite scroll: accumulate items across pages
    const mobileResetKey = JSON.stringify({
        currentGroupId,
        currentTagId,
        currentServiceId,
        currentEmployeeId,
        quickFilter,
        searchTerm,
        sortBy,
        sortOrder,
        pageSize,
    });
    const mobileResetKeyRef = useRef(mobileResetKey);

    useEffect(() => {
        if (!isMobile) return;
        if (mobileResetKey !== mobileResetKeyRef.current) {
            mobileResetKeyRef.current = mobileResetKey;
            setPage(1);
            setMobileAccumulated([]);
            return;
        }
        if (customers.length === 0 && page === 1) {
            setMobileAccumulated([]);
            return;
        }
        if (page === 1) {
            setMobileAccumulated(customers);
        } else {
            setMobileAccumulated((prev) => {
                const ids = new Set(prev.map((c) => c.id));
                return [...prev, ...customers.filter((c) => !ids.has(c.id))];
            });
        }
    }, [customers, page, isMobile, mobileResetKey]);

    useEffect(() => {
        if (!isMobile) return;
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isLoading && page < totalPages) {
                    setPage((p) => p + 1);
                }
            },
            { threshold: 0.1 },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [isMobile, isLoading, page, totalPages]);

    const exportCustomersCsv = () => {
        const header = [
            'Imię',
            'Nazwisko',
            'Telefon',
            'Email',
            'Data urodzenia',
            'Płeć',
            'Miasto',
            'Ostatnia wizyta',
            'Zgoda email',
            'Zgoda SMS',
        ];
        const rows = (isMobile ? mobileAccumulated : filteredCustomers).map(
            (c) => [
                c.firstName || '',
                c.lastName || '',
                c.phone || '',
                c.email || '',
                c.birthDate || '',
                c.gender || '',
                c.city || '',
                c.lastVisitDate
                    ? new Date(c.lastVisitDate).toLocaleDateString('pl-PL')
                    : '',
                c.emailConsent ? 'tak' : 'nie',
                c.smsConsent ? 'tak' : 'nie',
            ],
        );
        const csv = [header, ...rows]
            .map((line) =>
                line
                    .map((v) => `"${String(v).replaceAll('"', '""')}"`)
                    .join(';'),
            )
            .join('\n');
        const blob = new Blob([`﻿${csv}`], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'klienci.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <RouteGuard
            roles={['employee', 'receptionist', 'admin']}
            permission="nav:customers"
        >
            <Head>
                <title>Klienci — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="customers_index" id="customers_main">
                        <SalonBreadcrumbs
                            iconClass="sprite-breadcrumbs_customers"
                            items={[
                                { label: 'Klienci', href: '/customers' },
                                { label: 'Lista klientów' },
                            ]}
                        />

                        <div className="row mb-2">
                            <div className="col-sm-7 d-flex flex-wrap mb-2 mb-md-0">
                                <input
                                    type="text"
                                    name="query"
                                    placeholder="wyszukaj po nazwie, telefonie lub emailu"
                                    aria-label="Wyszukaj klienta"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setPage(1);
                                    }}
                                    className="form-control form-control-sm"
                                />
                            </div>
                            <div className="col-sm-5 text-end">
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    id="add_customer_button"
                                    onClick={() => setNewCustomerOpen(true)}
                                >
                                    <i
                                        className="icon sprite-add_customer"
                                        aria-hidden="true"
                                    />
                                    Dodaj klienta
                                </button>
                            </div>
                        </div>

                        <div className="customers-quick-filters mb-3">
                            {[
                                {
                                    key: 'upcoming',
                                    label: 'Nadchodząca wizyta',
                                },
                                {
                                    key: 'inactive6m',
                                    label: 'Brak wizyty >6 mies.',
                                },
                                { key: 'new', label: 'Nowi klienci' },
                                {
                                    key: 'noEmailConsent',
                                    label: 'Brak zgody email',
                                },
                                {
                                    key: 'noSmsConsent',
                                    label: 'Brak zgody SMS',
                                },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    type="button"
                                    className={`customers-quick-filter-chip${quickFilter === key ? ' active' : ''}`}
                                    onClick={() => {
                                        setQuickFilter((prev) =>
                                            prev === key ? '' : key,
                                        );
                                        setPage(1);
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {selectedIds.size > 0 && (
                            <div className="customers-bulk-bar">
                                <span className="customers-bulk-bar__count">
                                    Zaznaczono:{' '}
                                    <strong>{selectedIds.size}</strong>
                                </span>
                                <div className="customers-bulk-bar__actions">
                                    <select
                                        className="form-select form-select-sm"
                                        value={bulkGroupId}
                                        onChange={(e) =>
                                            setBulkGroupId(e.target.value)
                                        }
                                        aria-label="Wybierz grupę"
                                    >
                                        <option value="">
                                            Dodaj do grupy...
                                        </option>
                                        {groups?.map((g) => (
                                            <option
                                                key={g.id}
                                                value={String(g.id)}
                                            >
                                                {g.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        disabled={
                                            !bulkGroupId || bulkGroupPending
                                        }
                                        onClick={() =>
                                            void handleBulkAddToGroup()
                                        }
                                    >
                                        {bulkGroupPending
                                            ? 'Dodawanie...'
                                            : 'Dodaj do grupy'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={handleBulkNewsletter}
                                    >
                                        Newsletter
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-link text-muted"
                                        onClick={() =>
                                            setSelectedIds(new Set())
                                        }
                                    >
                                        Odznacz wszystkich
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeGroup && (
                            <div className="column_row results_info">
                                <button
                                    type="button"
                                    className="close close_all"
                                    aria-label="Wyczyść filtr"
                                    onClick={clearGroupFilter}
                                >
                                    ×
                                </button>
                                <div className="results_title">
                                    wybrane kryteria wyszukiwania:
                                </div>
                                <div id="selected_filters">
                                    <span>{activeGroup.name}</span>
                                </div>
                                <div className="results_size_info">
                                    Klientów spełniających kryteria:{' '}
                                    <strong>{displayedCustomers.length}</strong>
                                    <button
                                        type="button"
                                        id="create_group_button"
                                        onClick={() => {
                                            void router.push(
                                                {
                                                    pathname: router.pathname,
                                                    query: {
                                                        ...router.query,
                                                        openCreateGroup: '1',
                                                    },
                                                },
                                                undefined,
                                                { shallow: true },
                                            );
                                        }}
                                    >
                                        utwórz grupę
                                    </button>
                                </div>
                            </div>
                        )}

                        {isLoading ? (
                            <p className="text-muted">Ładowanie...</p>
                        ) : (
                            <>
                                <div className="all_customers_checker">
                                    <label>
                                        <input
                                            type="checkbox"
                                            aria-label="zaznacz wszystkich"
                                            checked={allChecked}
                                            ref={(el) => {
                                                if (el)
                                                    el.indeterminate =
                                                        someChecked;
                                            }}
                                            onChange={toggleSelectAll}
                                        />
                                        zaznacz wszystkich (
                                        <span>{displayedCustomers.length}</span>
                                        )
                                    </label>
                                </div>
                                <div
                                    id="customers_list"
                                    className="table-responsive"
                                >
                                    <table className="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th
                                                    className="customers-sort-th"
                                                    onClick={() =>
                                                        handleSort('name')
                                                    }
                                                    title="Sortuj po nazwie"
                                                >
                                                    <div>
                                                        Klient
                                                        <span
                                                            aria-hidden="true"
                                                            className="customers-sort-indicator"
                                                        >
                                                            {sortIndicator(
                                                                'name',
                                                            )}
                                                        </span>
                                                    </div>
                                                </th>
                                                <th scope="col">
                                                    <div>Kontakt</div>
                                                </th>
                                                <th
                                                    className="d-none d-sm-table-cell customers-sort-th"
                                                    onClick={() =>
                                                        handleSort(
                                                            'lastVisitDate',
                                                        )
                                                    }
                                                    title="Sortuj po ostatniej wizycie"
                                                >
                                                    <div>
                                                        Ostatnia wizyta
                                                        <span
                                                            aria-hidden="true"
                                                            className="customers-sort-indicator"
                                                        >
                                                            {sortIndicator(
                                                                'lastVisitDate',
                                                            )}
                                                        </span>
                                                    </div>
                                                </th>
                                                <th
                                                    className="text-end d-none d-sm-table-cell"
                                                    aria-label="Akcje"
                                                />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayedCustomers.map(
                                                (customer, i) => (
                                                    <DraggableCustomerRow
                                                        key={customer.id}
                                                        customer={customer}
                                                        isDragging={
                                                            draggedCustomer?.id ===
                                                            customer.id
                                                        }
                                                        isSelected={selectedIds.has(
                                                            customer.id,
                                                        )}
                                                        onToggleSelect={
                                                            toggleSelect
                                                        }
                                                        rowClass={
                                                            i % 2 === 0
                                                                ? 'odd'
                                                                : 'even'
                                                        }
                                                        onOpen={(id) =>
                                                            void router.push(
                                                                `/customers/${id}` as Route,
                                                            )
                                                        }
                                                        onEdit={(id) =>
                                                            setEditCustomerId(
                                                                id,
                                                            )
                                                        }
                                                    />
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {isMobile && (
                            <div
                                ref={sentinelRef}
                                className="customers-infinite-sentinel"
                                aria-hidden="true"
                            >
                                {isLoading && page > 1 ? (
                                    <p className="text-muted text-center small py-2">
                                        Ładowanie...
                                    </p>
                                ) : page < totalPages ? (
                                    <p className="text-muted text-center small py-2">
                                        Przewiń, aby załadować więcej
                                    </p>
                                ) : null}
                            </div>
                        )}

                        {!isMobile && (
                            <nav
                                className="pagination_container"
                                aria-label="Paginacja"
                            >
                                <div className="row">
                                    <div className="infocol-7">
                                        Pozycje od {fromItem} do {toItem} z{' '}
                                        <span id="total_found">
                                            {totalCount}
                                        </span>{' '}
                                        | na stronie{' '}
                                        <select
                                            name="size"
                                            aria-label="na stronie"
                                            value={pageSize}
                                            onChange={(e) => {
                                                setPageSize(
                                                    Number(e.target.value),
                                                );
                                                setPage(1);
                                            }}
                                        >
                                            <option value="20">20</option>
                                            <option value="50">50</option>
                                            <option value="100">100</option>
                                        </select>
                                    </div>
                                    <div className="form_paginationcol-5">
                                        <button
                                            type="button"
                                            className="btn btn-link"
                                            aria-label="Poprzednia strona"
                                            disabled={page <= 1}
                                            onClick={() =>
                                                setPage((p) => p - 1)
                                            }
                                        >
                                            <span
                                                className="fc-icon fc-icon-left-single-arrow"
                                                aria-hidden="true"
                                            />
                                        </button>
                                        <input
                                            type="text"
                                            name="page"
                                            className="pagination-page-input"
                                            aria-label="strona"
                                            value={page}
                                            readOnly
                                        />
                                        {' z '}
                                        <span>{totalPages}</span>
                                        <button
                                            type="button"
                                            className="btn btn-link button_next ml-s"
                                            aria-label="Następna strona"
                                            disabled={page >= totalPages}
                                            onClick={() =>
                                                setPage((p) => p + 1)
                                            }
                                        >
                                            <span
                                                className="fc-icon fc-icon-right-single-arrow"
                                                aria-hidden="true"
                                            />
                                        </button>
                                    </div>
                                </div>
                            </nav>
                        )}
                    </div>

                    <div className="products-export">
                        <button
                            type="button"
                            onClick={exportCustomersCsv}
                            className="btn btn-outline-secondary"
                        >
                            <div
                                className="icon sprite-exel_blue mr-xs"
                                aria-hidden="true"
                            />
                            pobierz bazę klientów w pliku Excel
                        </button>
                    </div>

                    <DragOverlay dropAnimation={null}>
                        {draggedCustomer ? (
                            <div className="clients-drag-overlay">
                                <span>{draggedCustomer.name}</span>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </SalonShell>
            <NewCustomerModal
                open={newCustomerOpen}
                onClose={() => setNewCustomerOpen(false)}
                onSuccess={() => setNewCustomerOpen(false)}
            />
            <EditCustomerModal
                open={editCustomerId !== null}
                customerId={editCustomerId}
                onClose={() => setEditCustomerId(null)}
                onSuccess={() => setEditCustomerId(null)}
                onDeleted={() => setEditCustomerId(null)}
            />
        </RouteGuard>
    );
}
