import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';
import {
    useCustomers,
    useCustomerGroups,
    useAddGroupMembers,
} from '@/hooks/useCustomers';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState, useMemo } from 'react';
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

// Komponent dla wiersza klienta z obsługą drag (Versum 1:1 style)
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
              opacity: isDragging ? 0.5 : 1,
              cursor: 'grab',
          }
        : {
              cursor: 'grab',
          };

    return (
        <tr
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={style}
            className={`${isDragging ? 'opacity-50' : ''} hover:bg-gray-50`}
            onClick={() => onOpen(customer.id)}
        >
            <td className="col-checkbox">
                <input
                    type="checkbox"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                />
            </td>
            <td className="col-name">
                <Link
                    href={`/clients/${customer.id}`}
                    className="clients-name-link"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {customer.fullName || customer.name}
                </Link>
            </td>
            <td className="col-email">
                {customer.email && (
                    <a
                        href={`mailto:${customer.email}`}
                        className="clients-icon-link"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        title={customer.email}
                    >
                        <i className="fa fa-envelope-o" aria-hidden="true" />
                    </a>
                )}
            </td>
            <td className="col-phone">
                {customer.phone && (
                    <a
                        href={`tel:${customer.phone}`}
                        className="clients-phone-link"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <i className="fa fa-phone" aria-hidden="true" />
                        {customer.phone}
                    </a>
                )}
            </td>
            <td className="col-last-visit">
                {customer.lastVisitDate
                    ? new Date(customer.lastVisitDate).toLocaleString('pl-PL', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                      })
                    : '-'}
            </td>
            <td className="col-actions">
                <Link
                    href={`/clients/${customer.id}/edit`}
                    className="clients-edit-link"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    title="Edytuj"
                >
                    <i className="fa fa-pencil" aria-hidden="true" />
                </Link>
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

    // Przygotuj filtry dla API
    const filters: CustomerFilterParams = useMemo(
        () => ({
            groupId: currentGroupId,
            tagId: currentTagId,
            serviceId: currentServiceId,
            employeeId: currentEmployeeId,
            hasUpcomingVisit:
                router.query.hasUpcomingVisit === 'true' ? true : undefined,
            limit: 50,
        }),
        [
            currentGroupId,
            currentTagId,
            currentServiceId,
            currentEmployeeId,
            router.query.hasUpcomingVisit,
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
            roles={['client', 'employee', 'receptionist', 'admin']}
            permission="nav:clients"
        >
            <VersumShell role={role}>
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="clients-page">
                        {/* Breadcrumbs - Versum style */}
                        <ul className="breadcrumb">
                            <li>Klienci / Lista klientów</li>
                        </ul>

                        {/* Toolbar - Versum style */}
                        <div className="clients-toolbar">
                            <div className="clients-search">
                                <input
                                    type="text"
                                    placeholder="wyszukaj klienta"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="versum-input"
                                />
                            </div>
                            <div className="clients-sort">
                                <button className="versum-btn versum-btn--link">
                                    nazwisko: od A do Z ▼
                                </button>
                            </div>
                            <Link
                                href="/clients/new"
                                className="versum-btn versum-btn--primary versum-btn--add"
                            >
                                <span className="btn-icon">+</span>
                                Dodaj klienta
                            </Link>
                        </div>

                        {/* Aktywne filtry - jak w Versum */}
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
                                    <button className="clients-filter-create-group">
                                        utwórz grupę
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Lista klientów */}
                        <div className="clients-list">
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
                                <table className="clients-table">
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
                                                        `/clients/${id}` as Route,
                                                    )
                                                }
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {/* Paginacja - Versum style */}
                            <div className="clients-pagination">
                                <span>
                                    Pozycje od 1 do {filteredCustomers.length} z{' '}
                                    {customersData?.total ||
                                        filteredCustomers.length}
                                </span>
                                <span className="clients-pagination-separator">
                                    |
                                </span>
                                <label>
                                    na stronie
                                    <select className="versum-select">
                                        <option>20</option>
                                        <option>50</option>
                                        <option>100</option>
                                    </select>
                                </label>
                                <div className="clients-pagination-nav">
                                    <input
                                        type="text"
                                        value="1"
                                        className="versum-input versum-input--small"
                                        readOnly
                                    />
                                    <span>z</span>
                                    <span>
                                        {Math.ceil(
                                            (customersData?.total ||
                                                filteredCustomers.length) / 20,
                                        )}
                                    </span>
                                    <button className="versum-btn versum-btn--icon">
                                        ›
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Drag Overlay - podgląd przeciąganego klienta */}
                    <DragOverlay dropAnimation={null}>
                        {draggedCustomer ? (
                            <div className="bg-white shadow-lg rounded p-12 border border-sky-200 flex items-center gap-8">
                                <span className="text-lg">👤</span>
                                <span className="font-medium">
                                    {draggedCustomer.name}
                                </span>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </VersumShell>
        </RouteGuard>
    );
}
