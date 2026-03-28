import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useServicesWithFilters } from '@/hooks/useServicesAdmin';
import { useServiceRanking } from '@/hooks/useStatistics';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import type { Role, Service, ServiceVariant } from '@/types';

// Extended service type with computed fields for display
interface ServiceWithDisplay extends Service {
    displayDuration?: string;
    displayPrice?: string;
    popularity?: number;
}

export default function ServicesPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <SalonShell role={role}>
            <ServicesPageContent role={role} />
        </SalonShell>
    );
}

function ServicesPageContent({ role }: { role: Role }) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const categoryId = router.query.categoryId
        ? Number(router.query.categoryId)
        : undefined;

    const { data: services = [], isLoading } = useServicesWithFilters({
        categoryId,
        includeCategory: true,
        includeVariants: true,
    });

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

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return processedServices;
        return processedServices.filter((service) => {
            return (
                service.name.toLowerCase().includes(query) ||
                (service.categoryRelation?.name || '')
                    .toLowerCase()
                    .includes(query)
            );
        });
    }, [search, processedServices]);

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
        const date = new Date().toISOString().slice(0, 10);
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
                <div className="col-sm-6">
                    <input
                        className="services-search-input"
                        placeholder="wyszukaj usługę"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
                <div className="col-sm-6 text-right mt-xs">
                    <Link href="/services/new" className="button button-blue">
                        dodaj usługę
                    </Link>
                </div>
            </div>

            {isLoading ? (
                <div className="salonbw-muted p-20">Ładowanie usług...</div>
            ) : (
                <>
                    <div className="column_row data_table">
                        <table className="table-bordered">
                            <thead>
                                <tr>
                                    <th className="pointer checkbox_container center_text">
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
                                    </th>
                                    <th>Nazwa</th>
                                    <th>Kategoria</th>
                                    <th>Czas trwania</th>
                                    <th>Popularność</th>
                                    <th>Cena brutto</th>
                                    <th>VAT</th>
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
                                                <input
                                                    type="checkbox"
                                                    aria-label="Wybierz usługę"
                                                    checked={selectedIds.includes(
                                                        service.id,
                                                    )}
                                                    onChange={() =>
                                                        toggleSelect(service.id)
                                                    }
                                                />
                                            </td>
                                            <td className="wrap blue_text pointer link_body w-40p">
                                                <Link
                                                    href={`/services/${service.id}`}
                                                >
                                                    {service.name}
                                                </Link>
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
                                            <td className="text-right pr-m">
                                                {service.displayPrice}
                                            </td>
                                            <td>{service.vatRate ?? 23}%</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="salonbw-muted p-20 text-center"
                                        >
                                            Brak usług spełniających kryteria
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination_container">
                        <div className="column_row">
                            <div className="row">
                                <div className="info col-xs-7">
                                    Pozycje od{' '}
                                    {(currentPage - 1) * itemsPerPage + 1} do{' '}
                                    {Math.min(
                                        currentPage * itemsPerPage,
                                        totalItems,
                                    )}{' '}
                                    z <span id="total_found">{totalItems}</span>
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
                                <div className="form_pagination col-xs-5 text-right">
                                    <input
                                        type="text"
                                        className="pagination-page-input"
                                        aria-label="Aktualna strona"
                                        value={currentPage}
                                        onChange={(e) => {
                                            const page = Number(e.target.value);
                                            if (
                                                page >= 1 &&
                                                page <= totalPages
                                            ) {
                                                setCurrentPage(page);
                                            }
                                        }}
                                    />
                                    <span className="conjunction"> z </span>
                                    <a className="pointer">{totalPages}</a>
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
                    </div>

                    <div className="products-export">
                        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                downloadCsvPriceList();
                            }}
                            className="button"
                        >
                            <div
                                className="icon sprite-exel_blue mr-xs"
                                aria-hidden="true"
                            />
                            pobierz cennik w pliku Excel
                        </a>
                    </div>
                </>
            )}
        </div>
    );
}
