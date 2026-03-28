import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import {
    useCustomers,
    useCustomerGroups,
    useAddGroupMembers,
} from '@/hooks/useCustomers';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
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

// Komponent dla wiersza klienta z obsługą drag (styl source UI)
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
    onOpen,
}: {
    customer: Customer;
    isDragging: boolean;
    onOpen: (id: number) => void;
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
            className={`${isDragging ? 'opacity-50' : ''}`}
            onClick={() => onOpen(customer.id)}
        >
            <td className="col-checkbox">
                <input
                    type="checkbox"
                    aria-label="Wybierz klienta"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                />
            </td>
            <td className="col-name">
                <Link
                    href={`/customers/${customer.id}`}
                    className="clients-name-link"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {customer.fullName || customer.name}
                </Link>
            </td>
            <td className="col-phone">
                <div className="clients-contact-cell">
                    {customer.email ? (
                        <a
                            href={`mailto:${customer.email}`}
                            className="clients-icon-link"
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            title={customer.email}
                        >
                            <i
                                className="fa fa-envelope-o"
                                aria-hidden="true"
                            />
                        </a>
                    ) : null}
                    {customer.phone ? (
                        <a
                            href={`tel:${customer.phone}`}
                            className="clients-phone-link"
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <i className="fa fa-phone" aria-hidden="true" />
                            {customer.phone}
                        </a>
                    ) : (
                        <span className="clients-phone-empty">nie podano</span>
                    )}
                </div>
            </td>
            <td className="col-last-visit">
                {formatLastVisit(customer.lastVisitDate)}
            </td>
            <td className="col-actions">
                <div className="clients-actions-wrap">
                    <span
                        className="clients-drag-handle"
                        title="Przeciągnij do grupy"
                        {...listeners}
                        {...attributes}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        ⋮⋮
                    </span>
                    <Link
                        href={`/customers/${customer.id}/edit`}
                        className="clients-edit-link"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        title="Edytuj"
                    >
                        <i className="fa fa-pencil" aria-hidden="true" />
                    </Link>
                </div>
            </td>
        </tr>
    );
}

export default function ClientsPage() {
    const { role } = useAuth();
    const router = useRouter();

    // Pobierz aktywne filtry z URL
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

    // Reset to page 1 when URL filters change
    useEffect(() => {
        setPage(1);
    }, [currentGroupId, currentTagId, currentServiceId, currentEmployeeId]);

    // Przygotuj filtry dla API
    const filters: CustomerFilterParams = useMemo(
        () => ({
            groupId: currentGroupId,
            tagId: currentTagId,
            serviceId: currentServiceId,
            employeeId: currentEmployeeId,
            hasUpcomingVisit:
                router.query.hasUpcomingVisit === 'true' ? true : undefined,
            limit: pageSize,
            page,
        }),
        [
            currentGroupId,
            currentTagId,
            currentServiceId,
            currentEmployeeId,
            router.query.hasUpcomingVisit,
            page,
            pageSize,
        ],
    );

    const { data: customersData, isLoading } = useCustomers(filters);
    const customers = customersData?.items ?? [];
    const { data: groups } = useCustomerGroups();
    const addToGroup = useAddGroupMembers();
    const [searchTerm, setSearchTerm] = useState('');
    const [draggedCustomer, setDraggedCustomer] = useState<Customer | null>(
        null,
    );
    const sensors = useSensors(
        useSensor(PointerSensor, {
            // Prevent normal clicks from being treated as drag starts.
            activationConstraint: { distance: 8 },
        }),
    );

    const activeGroup = groups?.find((g) => g.id === currentGroupId);

    // Funkcja do czyszczenia filtra
    const clearGroupFilter = () => {
        const restQuery = { ...router.query };
        delete restQuery.groupId;
        void router.push(
            { pathname: router.pathname, query: restQuery },
            undefined,
            { shallow: true },
        );
    };

    // Lokalne filtrowanie wyszukiwania (wyszukuje w już przefiltrowanych przez API)
    const filteredCustomers = searchTerm
        ? customers.filter(
              (c) =>
                  c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.phone?.includes(searchTerm),
          )
        : customers;

    // Handlery dla Drag & Drop
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

                // Sprawdź czy klient już jest w grupie
                const group = groups?.find((g) => g.id === groupId);
                const customer = customers.find((c) => c.id === customerId);

                if (
                    group &&
                    customer &&
                    !customer.groups?.some((g) => g.id === groupId)
                ) {
                    await addToGroup.mutateAsync({
                        groupId,
                        customerIds: [customerId],
                    });
                }
            }

            setDraggedCustomer(null);
        })();
    };

    if (!role) return null;

    return (
        <RouteGuard
            roles={['employee', 'receptionist', 'admin']}
            permission="nav:customers"
        >
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

                        {/* Toolbar - styl source UI */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="wyszukaj klienta"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setPage(1);
                                    }}
                                    className="salonbw-input"
                                />
                                <button className="salonbw-btn salonbw-btn--link">
                                    nazwisko: od A do Z ▼
                                </button>
                            </div>
                            <Link
                                href="/customers/new"
                                className="salonbw-btn salonbw-btn--primary salonbw-btn--add"
                            >
                                <span className="btn-icon">+</span>
                                Dodaj klienta
                            </Link>
                        </div>

                        {/* Aktywne filtry - jak w source UI */}
                        {activeGroup && (
                            <div className="clients-active-filters">
                                <div className="clients-filter-header">
                                    <span>wybrane kryteria wyszukiwania:</span>
                                    <button
                                        onClick={clearGroupFilter}
                                        className="clients-filter-close"
                                        title="Wyczyść filtry"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="clients-filter-badge">
                                    <span className="clients-filter-tag">
                                        należą do grup (
                                        {filteredCustomers.length})
                                        <span className="clients-filter-name">
                                            {activeGroup.name}
                                        </span>
                                        <button
                                            onClick={clearGroupFilter}
                                            className="clients-filter-remove"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                </div>
                                <div className="clients-filter-stats">
                                    <span>
                                        Klientów spełniających kryteria:
                                    </span>
                                    <strong>{filteredCustomers.length}</strong>
                                    <button
                                        className="clients-filter-create-group"
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

                        {/* Lista klientów */}
                        <div className="bg-white border border-gray-300 rounded-sm">
                            <div className="clients-list-header">
                                <label className="clients-checkbox-all">
                                    <input type="checkbox" />
                                    <span>zaznacz wszystkich (0)</span>
                                </label>
                            </div>

                            {isLoading ? (
                                <div className="clients-loading">
                                    Ładowanie...
                                </div>
                            ) : (
                                <table className="w-full">
                                    <tbody>
                                        {filteredCustomers.map((customer) => (
                                            <DraggableCustomerRow
                                                key={customer.id}
                                                customer={customer}
                                                isDragging={
                                                    draggedCustomer?.id ===
                                                    customer.id
                                                }
                                                onOpen={(id) =>
                                                    void router.push(
                                                        `/customers/${id}` as Route,
                                                    )
                                                }
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {/* Paginacja - styl source UI */}
                            {(() => {
                                const totalCount = customersData?.total ?? 0;
                                const totalPages =
                                    customersData?.totalPages ??
                                    (Math.ceil(totalCount / pageSize) || 1);
                                const fromItem =
                                    totalCount === 0
                                        ? 0
                                        : (page - 1) * pageSize + 1;
                                const toItem = Math.min(
                                    page * pageSize,
                                    totalCount,
                                );
                                return (
                                    <div className="clients-pagination">
                                        <span>
                                            Pozycje od {fromItem} do {toItem} z{' '}
                                            {totalCount}
                                        </span>
                                        <span className="clients-pagination-separator">
                                            |
                                        </span>
                                        <label>
                                            na stronie
                                            <select
                                                className="salonbw-select"
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
                                        </label>
                                        <div className="clients-pagination-nav">
                                            <button
                                                type="button"
                                                className="salonbw-btn salonbw-btn--icon"
                                                onClick={() =>
                                                    setPage((p) => p - 1)
                                                }
                                                disabled={page <= 1}
                                            >
                                                ‹
                                            </button>
                                            <input
                                                type="text"
                                                value={page}
                                                className="salonbw-input salonbw-input--small"
                                                aria-label="Aktualna strona"
                                                readOnly
                                            />
                                            <span>z</span>
                                            <span>{totalPages}</span>
                                            <button
                                                type="button"
                                                className="salonbw-btn salonbw-btn--icon"
                                                onClick={() =>
                                                    setPage((p) => p + 1)
                                                }
                                                disabled={page >= totalPages}
                                            >
                                                ›
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Drag Overlay - podgląd przeciąganego klienta */}
                    <DragOverlay dropAnimation={null}>
                        {draggedCustomer ? (
                            <div className="bg-white shadow-lg rounded p-12 border border-sky-200 flex items-center gap-8">
                                <span className="font-medium">
                                    {draggedCustomer.name}
                                </span>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </SalonShell>
        </RouteGuard>
    );
}
