import { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    useServicesWithFilters,
    useDeleteService,
    useServiceCategories,
} from '@/hooks/useServicesAdmin';
import { useServiceRanking } from '@/hooks/useStatistics';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { Role, Service, ServiceVariant } from '@/types';
import { todayISODate } from '@/utils/date';

// Extended service type with computed fields for display
interface ServiceWithDisplay extends Service {
    displayDuration?: string;
    displayPrice?: string;
    popularity?: number;
}

export default function ServicesPage() {
    const { role } = useAuth();

    return (
        <RouteGuard roles={['admin']} permission="nav:services">
            <Head>
                <title>Usługi — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <ServicesPageContent role={role} />
            </SalonShell>
        </RouteGuard>
    );
}

function ServicesPageContent({ role }: { role: Role | null }) {
    const router = useRouter();
    const toast = useToast();
    const [search, setSearch] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkDeletePending, setBulkDeletePending] = useState(false);
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
    const deleteService = useDeleteService();

    const categoryId = router.query.categoryId
        ? Number(router.query.categoryId)
        : undefined;

    const { data: services = [], isLoading } = useServicesWithFilters({
        categoryId,
        includeCategory: true,
        includeVariants: true,
    });

    const { data: categories = [] } = useServiceCategories();

    const { data: ranking = [] } = useServiceRanking({
        range: 'this_month',
        enabled: role === 'admin',
    });

    const popularityByServiceId = useMemo(() => {
        const map = new Map<number, number>();
        for (const row of ranking) {
            map.set(Number(row.serviceId), row.bookingCount);
        }
        return map;
    }, [ranking]);

    // Process services with display values
    const processedServices: ServiceWithDisplay[] = useMemo(() => {
        return services.map((service) => {
            const variants = service.variants || [];

            // Calculate duration range from variants
            let displayDuration = `${service.duration} minut`;
            if (variants.length > 0) {
                const durations = [
                    service.duration,
                    ...variants.map((v: ServiceVariant) => v.duration),
                ];
                const minDuration = Math.min(...durations);
                const maxDuration = Math.max(...durations);
                if (minDuration !== maxDuration) {
                    displayDuration = `${minDuration} - ${maxDuration} minut`;
                } else {
                    displayDuration = `${minDuration} minut`;
                }
            }

            // Calculate price range from variants
            let displayPrice = `${Number(service.price).toFixed(2).replace('.', ',')} zł`;
            if (variants.length > 0) {
                const prices = [
                    service.price,
                    ...variants.map((v: ServiceVariant) => v.price),
                ];
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                const minFormatted =
                    Number(minPrice).toFixed(2).replace('.', ',') + ' zł';
                const maxFormatted =
                    Number(maxPrice).toFixed(2).replace('.', ',') + ' zł';
                if (minPrice !== maxPrice) {
                    displayPrice = `${minFormatted} - ${maxFormatted}`;
                } else {
                    displayPrice = minFormatted;
                }
            }

            const popularity =
                role === 'admin'
                    ? (popularityByServiceId.get(service.id) ?? 0)
                    : undefined;

            return {
                ...service,
                displayDuration,
                displayPrice,
                popularity,
            };
        });
    }, [services, popularityByServiceId, role]);

    const inactiveCount = useMemo(
        () => processedServices.filter((s) => s.isActive === false).length,
        [processedServices],
    );

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return processedServices.filter((service) => {
            if (!showInactive && service.isActive === false) return false;
            if (!query) return true;
            return (
                service.name.toLowerCase().includes(query) ||
                (service.categoryRelation?.name || '')
                    .toLowerCase()
                    .includes(query)
            );
        });
    }, [search, processedServices, showInactive]);

    // Pagination
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

    const paginatedServices = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filtered.slice(start, start + itemsPerPage);
    }, [filtered, currentPage, itemsPerPage]);

    const toggleSelectAll = () => {
        if (selectedIds.length === paginatedServices.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(paginatedServices.map((s) => s.id));
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
    };

    const handleBulkDelete = () => {
        setConfirmBulkDelete(true);
    };

    const doBulkDelete = () => {
        setBulkDeletePending(true);
        let failed = 0;
        const ids = [...selectedIds];
        const run = async () => {
            for (const id of ids) {
                try {
                    await deleteService.mutateAsync(id);
                } catch {
                    failed++;
                }
            }
            setBulkDeletePending(false);
            setSelectedIds([]);
            if (failed === 0) {
                toast.success('Usługi zostały usunięte');
            } else {
                toast.error(`Nie udało się usunąć ${failed} usług(i)`);
            }
        };
        void run();
    };

    const formatPopularity = (count?: number): string => {
        if (count === undefined || count === null) return '0 razy';
        if (count === 1) return 'raz';
        if (count >= 2 && count <= 4) return `${count} razy`;
        return `${count} razy`;
    };

    const downloadCsvPriceList = () => {
        const esc = (val: unknown) => {
            const s = String(val ?? '');
            if (/[",\n\r]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
            return s;
        };

        const lines: string[] = [];
        lines.push(
            [
                'id',
                'name',
                'category',
                'duration',
                'price_gross',
                'vat_rate',
                'active',
                'online_booking',
            ].join(','),
        );

        for (const s of filtered) {
            lines.push(
                [
                    esc(s.id),
                    esc(s.name),
                    esc(s.categoryRelation?.name ?? ''),
                    esc(s.displayDuration ?? ''),
                    esc(s.displayPrice ?? ''),
                    esc(s.vatRate ?? 23),
                    esc(s.isActive ? 1 : 0),
                    esc(s.onlineBooking ? 1 : 0),
                ].join(','),
            );
        }

        const content = '\uFEFF' + lines.join('\n') + '\n';
        const blob = new Blob([content], {
            type: 'text/csv;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = todayISODate();
        a.href = url;
        a.download = `cennik-uslugi-${date}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="salonbw-page" data-testid="services-page">
            <SalonBreadcrumbs
                iconClass="sprite-breadcrumbs_services"
                items={[{ label: 'Usługi' }]}
            />

            <div className="row mb-xl">
                <div className="col-sm-4">
                    <input
                        className="services-search-input"
                        placeholder="wyszukaj usługę"
                        aria-label="Wyszukaj usługę"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
                <div className="col-sm-4">
                    <select
                        className="form-select"
                        aria-label="Filtruj po kategorii"
                        value={categoryId ?? ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            void router.push(
                                {
                                    pathname: router.pathname,
                                    query: val ? { categoryId: val } : {},
                                },
                                undefined,
                                { shallow: true },
                            );
                            setCurrentPage(1);
                        }}
                    >
                        <option value="">wszystkie kategorie</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-sm-4 text-end mt-1 d-flex align-items-center justify-content-end gap-3">
                    {inactiveCount > 0 && (
                        <label
                            className="d-inline-flex align-items-center gap-2 text-muted small mb-0"
                            style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                            <input
                                type="checkbox"
                                checked={showInactive}
                                onChange={(e) => {
                                    setShowInactive(e.target.checked);
                                    setCurrentPage(1);
                                }}
                            />
                            pokaż nieaktywne ({inactiveCount})
                        </label>
                    )}
                    <Link href="/services/new" className="btn btn-primary">
                        dodaj usługę
                    </Link>
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div className="d-flex align-items-center gap-2 mb-3 p-2 bg-light border rounded">
                    <span className="text-muted small">
                        Zaznaczono: <strong>{selectedIds.length}</strong>
                    </span>
                    <button
                        type="button"
                        className="btn btn-sm btn-danger ms-2"
                        disabled={bulkDeletePending}
                        onClick={handleBulkDelete}
                    >
                        {bulkDeletePending ? 'Usuwanie...' : 'Usuń zaznaczone'}
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setSelectedIds([])}
                    >
                        Odznacz wszystkie
                    </button>
                </div>
            )}

            {isLoading ? (
                <div className="text-muted">Ładowanie usług...</div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="table table-bordered">
                            <thead>
                                <tr>
                                    <th
                                        scope="col"
                                        className="pointer checkbox_container center_text"
                                    >
                                        <label className="mb-0 mt-1">
                                            <input
                                                type="checkbox"
                                                aria-label="Wybierz wszystkie usługi"
                                                checked={
                                                    selectedIds.length ===
                                                        paginatedServices.length &&
                                                    paginatedServices.length > 0
                                                }
                                                onChange={toggleSelectAll}
                                            />
                                        </label>
                                    </th>
                                    <th scope="col">
                                        <div>Nazwa</div>
                                    </th>
                                    <th scope="col">
                                        <div>Kategoria</div>
                                    </th>
                                    <th scope="col">
                                        <div>Czas trwania</div>
                                    </th>
                                    <th scope="col">
                                        <div>Popularność</div>
                                    </th>
                                    <th scope="col">
                                        <div>Cena brutto</div>
                                    </th>
                                    <th scope="col">
                                        <div>VAT</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedServices.length > 0 ? (
                                    paginatedServices.map((service, i) => (
                                        <tr
                                            key={service.id}
                                            className={
                                                i % 2 === 0 ? 'odd' : 'even'
                                            }
                                        >
                                            <td className="pointer checkbox_container center_text">
                                                <label className="mb-0 mt-1">
                                                    <input
                                                        type="checkbox"
                                                        aria-label="Wybierz usługę"
                                                        checked={selectedIds.includes(
                                                            service.id,
                                                        )}
                                                        onChange={() =>
                                                            toggleSelect(
                                                                service.id,
                                                            )
                                                        }
                                                    />
                                                </label>
                                            </td>
                                            <td className="wrap blue_text pointer link_body w-40p">
                                                <Link
                                                    href={`/services/${service.id}`}
                                                >
                                                    {service.name}
                                                </Link>
                                                {service.isActive === false && (
                                                    <span
                                                        className="badge ms-2"
                                                        style={{
                                                            background:
                                                                '#e9ecef',
                                                            color: '#6e7278',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        nieaktywna
                                                    </span>
                                                )}
                                            </td>
                                            <td className="wrap">
                                                {service.categoryRelation
                                                    ?.name ??
                                                    'usługi bez kategorii'}
                                            </td>
                                            <td className="wrap">
                                                {service.displayDuration}
                                            </td>
                                            <td className="wrap">
                                                {formatPopularity(
                                                    service.popularity,
                                                )}
                                            </td>
                                            <td className="text-end pe-2">
                                                {service.displayPrice}
                                            </td>
                                            <td>{service.vatRate ?? 23}%</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-muted text-center"
                                        >
                                            Brak usług spełniających kryteria
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {filtered.length > 0 && (
                        <nav
                            className="pagination_container"
                            aria-label="Paginacja"
                        >
                            <div className="column_row">
                                <div className="row">
                                    <div className="infocol-7">
                                        Pozycje od{' '}
                                        {(currentPage - 1) * itemsPerPage + 1}{' '}
                                        do{' '}
                                        {Math.min(
                                            currentPage * itemsPerPage,
                                            totalItems,
                                        )}{' '}
                                        z{' '}
                                        <span id="total_found">
                                            {totalItems}
                                        </span>
                                        <span>{' | na stronie '}</span>
                                        <select
                                            className="pagination-size-select"
                                            aria-label="Liczba elementów na stronie"
                                            value={itemsPerPage}
                                            onChange={(e) => {
                                                setItemsPerPage(
                                                    Number(e.target.value),
                                                );
                                                setCurrentPage(1);
                                            }}
                                        >
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </div>
                                    <div className="form_paginationcol-5 text-end">
                                        <input
                                            type="text"
                                            className="pagination-page-input"
                                            aria-label="Aktualna strona"
                                            value={currentPage}
                                            onChange={(e) => {
                                                const page = Number(
                                                    e.target.value,
                                                );
                                                if (
                                                    page >= 1 &&
                                                    page <= totalPages
                                                ) {
                                                    setCurrentPage(page);
                                                }
                                            }}
                                        />
                                        <span className="conjunction"> z </span>
                                        <span>{totalPages}</span>
                                        <button
                                            type="button"
                                            className="button button_next ml-s"
                                            aria-label="Następna strona"
                                            disabled={currentPage >= totalPages}
                                            onClick={() =>
                                                setCurrentPage((p) =>
                                                    Math.min(totalPages, p + 1),
                                                )
                                            }
                                        >
                                            <span
                                                className="fc-icon fc-icon-right-single-arrow"
                                                aria-hidden="true"
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </nav>
                    )}

                    <div className="products-export">
                        <button
                            type="button"
                            onClick={downloadCsvPriceList}
                            className="btn btn-outline-secondary"
                        >
                            <div
                                className="icon sprite-exel_blue mr-xs"
                                aria-hidden="true"
                            />
                            pobierz cennik w pliku Excel
                        </button>
                    </div>
                </>
            )}
            <ConfirmModal
                open={confirmBulkDelete}
                title="Usuń usługi"
                message={`Czy na pewno chcesz usunąć ${selectedIds.length} usług(i)? Operacja jest nieodwracalna.`}
                confirmLabel="Usuń"
                confirmVariant="danger"
                onConfirm={() => {
                    setConfirmBulkDelete(false);
                    doBulkDelete();
                }}
                onCancel={() => setConfirmBulkDelete(false)}
            />
        </div>
    );
}
