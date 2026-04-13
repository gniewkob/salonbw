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
    rowClass,
    isSelected,
    onToggleSelection,
}: {
    customer: Customer;
    isDragging: boolean;
    onOpen: (id: number) => void;
    rowClass?: string;
    isSelected: boolean;
    onToggleSelection: (id: number) => void;
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
            className={`customer-row ${rowClass ?? ''} ${isDragging ? 'opacity-50' : ''}`.trim()}
            onClick={() => onOpen(customer.id)}
        >
            <td className="w-50p">
                <span className="checkbox_container">
                    <input
                        type="checkbox"
                        aria-label="Wybierz klienta"
                        checked={isSelected}
                        onChange={() => onToggleSelection(customer.id)}
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
            </td>
            <td>
                {customer.email ? (
                    <a
                        href={`/newsletters/new?platform=email&recipient=${encodeURIComponent(customer.email)}&recipientId=${customer.id}&single=1`}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <div
                            className="icon_box"
                            title={`wyślij email: ${customer.email}`}
                        >
                            <i className="icon sprite-customer_email" />
                        </div>
                    </a>
                ) : (
                    <div className="icon_box" title="nie podano">
                        <i className="icon sprite-customer_email icon-opacity" />
                    </div>
                )}
                {customer.phone ? (
                    <div className="inline_block">
                        <a
                            href={`tel:${customer.phone}`}
                            className="versum-phone-button"
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <div className="icon_box pull-left">
                                <i className="icon sprite-customer_telephone" />
                            </div>
                            {customer.phone}
                        </a>
                    </div>
                ) : null}
            </td>
            <td className="hidden-xs">
                <div
                    className="icon_box"
                    title={
                        customer.lastVisitDate
                            ? `ostatnia wizyta: ${formatLastVisit(customer.lastVisitDate)}`
                            : 'brak wizyt'
                    }
                >
                    <i className="icon sprite-settings_opening_hours" />
                </div>
                <span>{formatLastVisit(customer.lastVisitDate)}</span>
            </td>
            <td
                className="text-right hidden-xs"
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
                    href={`/customers/${customer.id}/edit`}
                    className="button button-link"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    title="Edytuj"
                >
                    <i className="icon sprite-pencil" aria-hidden="true" />
                </Link>
            </td>
        </tr>
    );
}

export default function CustomersPage() {
    const { role } = useAuth();
    const router = useRouter();

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
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setPage(1);
    }, [currentGroupId, currentTagId, currentServiceId, currentEmployeeId]);

    const filters: CustomerFilterParams = useMemo(
        () => ({
            groupId: currentGroupId,
            tagId: currentTagId,
            serviceId: currentServiceId,
            employeeId: currentEmployeeId,
            search: searchTerm || undefined,
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
            searchTerm,
            router.query.hasUpcomingVisit,
            page,
            pageSize,
        ],
    );

    const { data: customersData, isLoading } = useCustomers(filters);
    const customers = useMemo(() => customersData?.data ?? [], [customersData]);
    const { data: groups } = useCustomerGroups();
    const addToGroup = useAddGroupMembers();
    const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>(
        [],
    );
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

    useEffect(() => {
        setSelectedCustomerIds((current) =>
            current.filter((id) =>
                customers.some((customer) => customer.id === id),
            ),
        );
    }, [customers]);

    const visibleCustomerIds = filteredCustomers.map((customer) => customer.id);
    const allVisibleSelected =
        visibleCustomerIds.length > 0 &&
        visibleCustomerIds.every((id) => selectedCustomerIds.includes(id));

    const toggleCustomerSelection = (customerId: number) => {
        setSelectedCustomerIds((current) =>
            current.includes(customerId)
                ? current.filter((id) => id !== customerId)
                : [...current, customerId],
        );
    };

    const toggleVisibleSelection = () => {
        setSelectedCustomerIds((current) => {
            if (allVisibleSelected) {
                return current.filter((id) => !visibleCustomerIds.includes(id));
            }

            return Array.from(new Set([...current, ...visibleCustomerIds]));
        });
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
                    await addToGroup.mutateAsync({
                        groupId,
                        customerIds: [customerId],
                    });
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

                        <div className="row mb-l">
                            <div className="col-sm-7 d-flex flex-wrap mb-m mb-md-0">
                                <input
                                    type="text"
                                    name="query"
                                    placeholder="wyszukaj klienta"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setPage(1);
                                    }}
                                    className="right_space"
                                />
                            </div>
                            <div className="col-sm-5 text-right">
                                <Link
                                    href="/customers/new"
                                    className="button button-blue"
                                    id="add_customer_button"
                                >
                                    <i className="icon sprite-add_customer" />
                                    Dodaj klienta
                                </Link>
                            </div>
                        </div>

                        {activeGroup && (
                            <div className="column_row results_info">
                                <a
                                    className="close close_all"
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        clearGroupFilter();
                                    }}
                                >
                                    ×
                                </a>
                                <div className="results_title">
                                    wybrane kryteria wyszukiwania:
                                </div>
                                <div id="selected_filters">
                                    <span>{activeGroup.name}</span>
                                </div>
                                <div className="results_size_info">
                                    Klientów spełniających kryteria:{' '}
                                    <strong>{filteredCustomers.length}</strong>
                                    <a
                                        href="#"
                                        id="create_group_button"
                                        onClick={(e) => {
                                            e.preventDefault();
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
                                    </a>
                                </div>
                            </div>
                        )}

                        {isLoading ? (
                            <p className="salonbw-muted p-20">Ładowanie...</p>
                        ) : (
                            <>
                                <div className="column_row all_customers_checker">
                                    <label>
                                        <input
                                            type="checkbox"
                                            aria-label="zaznacz wszystkich"
                                            checked={allVisibleSelected}
                                            disabled={
                                                visibleCustomerIds.length === 0
                                            }
                                            onChange={toggleVisibleSelection}
                                        />
                                        zaznacz wszystkich (
                                        <span>{filteredCustomers.length}</span>)
                                    </label>
                                </div>
                                <div
                                    className="column_row details_container"
                                    id="customers_list"
                                >
                                    <table className="list-table">
                                        <thead>
                                            <tr>
                                                <th>Klient</th>
                                                <th>Kontakt</th>
                                                <th className="hidden-xs">
                                                    Ostatnia wizyta
                                                </th>
                                                <th
                                                    className="text-right hidden-xs"
                                                    aria-label="Akcje"
                                                />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCustomers.map(
                                                (customer, i) => (
                                                    <DraggableCustomerRow
                                                        key={customer.id}
                                                        customer={customer}
                                                        isDragging={
                                                            draggedCustomer?.id ===
                                                            customer.id
                                                        }
                                                        rowClass={
                                                            i % 2 === 0
                                                                ? 'odd'
                                                                : 'even'
                                                        }
                                                        isSelected={selectedCustomerIds.includes(
                                                            customer.id,
                                                        )}
                                                        onToggleSelection={
                                                            toggleCustomerSelection
                                                        }
                                                        onOpen={(id) =>
                                                            void router.push(
                                                                `/customers/${id}` as Route,
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

                        <div className="pagination_container">
                            <div className="row">
                                <div className="info col-xs-7">
                                    Pozycje od {fromItem} do {toItem} z{' '}
                                    <span id="total_found">{totalCount}</span> |
                                    na stronie{' '}
                                    <select
                                        name="size"
                                        aria-label="na stronie"
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPage(1);
                                        }}
                                    >
                                        <option value="20">20</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                </div>
                                <div className="form_pagination col-xs-5">
                                    <button
                                        type="button"
                                        className="button button-link"
                                        aria-label="Poprzednia strona"
                                        disabled={page <= 1}
                                        onClick={() => setPage((p) => p - 1)}
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
                                    <span className="pointer">
                                        {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        className="button button-link button_next ml-s"
                                        aria-label="Następna strona"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage((p) => p + 1)}
                                    >
                                        <span
                                            className="fc-icon fc-icon-right-single-arrow"
                                            aria-hidden="true"
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DragOverlay dropAnimation={null}>
                        {draggedCustomer ? (
                            <div className="customers-drag-overlay">
                                <span>{draggedCustomer.name}</span>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </SalonShell>
        </RouteGuard>
    );
}
