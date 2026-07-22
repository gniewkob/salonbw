import Head from 'next/head';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import NewProductModal from '@/components/warehouse/NewProductModal';
import EditProductModal from '@/components/warehouse/EditProductModal';
import ConfirmModal from '@/components/ConfirmModal';
import {
    useWarehouseProducts,
    useProductCategories,
} from '@/hooks/useWarehouseViews';
import { getProductTypeLabel } from '@/lib/warehouse/productTypeLabel';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ProductCategory } from '@/types';

function flattenCategoryIds(
    nodes: ProductCategory[],
    targetId: number,
): number[] {
    const collectDescendantIds = (arr: ProductCategory[]): number[] =>
        arr.flatMap((node) => [
            node.id,
            ...collectDescendantIds(node.children || []),
        ]);

    for (const node of nodes) {
        if (node.id === targetId) {
            return collectDescendantIds(node.children || []);
        }
        if (node.children?.length) {
            const nestedIds = flattenCategoryIds(node.children, targetId);
            if (nestedIds.length > 0) {
                return nestedIds;
            }
        }
    }

    return [];
}

type ProductTypeFilter = 'all' | 'product_and_supply' | 'product' | 'supply';

const productTypeOptions: { value: ProductTypeFilter; label: string }[] = [
    { value: 'all', label: 'wszystkie produkty' },
    { value: 'product_and_supply', label: 'towar i materiał' },
    { value: 'product', label: 'towar' },
    { value: 'supply', label: 'materiał' },
];

export default function WarehouseProductsPage() {
    const router = useRouter();
    const { apiFetch } = useAuth();
    const toast = useToast();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [productTypeFilter, setProductTypeFilter] =
        useState<ProductTypeFilter>('all');
    const [newProductOpen, setNewProductOpen] = useState(false);
    const [editProductId, setEditProductId] = useState<number | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileCount, setMobileCount] = useState(20);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [page, setPage] = useState(1);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [bulkDeletePending, setBulkDeletePending] = useState(false);
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 575px)');
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const selectedCategoryId = router.query.categoryId
        ? Number(router.query.categoryId)
        : undefined;
    const showUncategorized = router.query.uncategorized === 'true';

    useEffect(() => {
        setMobileCount(20);
        setPage(1);
    }, [search, productTypeFilter, selectedCategoryId, showUncategorized]);

    const { data: categories = [] } = useProductCategories();
    const { data: products = [], isLoading } = useWarehouseProducts({
        search: search || undefined,
        includeInactive: true,
    });

    const flatCategoryIds = useMemo(
        () =>
            selectedCategoryId
                ? flattenCategoryIds(categories, selectedCategoryId)
                : [],
        [categories, selectedCategoryId],
    );

    const filteredProducts = useMemo(() => {
        let result = products;

        // Filter by category
        if (showUncategorized) {
            result = result.filter((product) => !product.categoryId);
        } else if (selectedCategoryId) {
            result = result.filter((product) => {
                if (!product.categoryId) return false;
                return (
                    product.categoryId === selectedCategoryId ||
                    flatCategoryIds.includes(product.categoryId)
                );
            });
        }

        // Filter by product type
        if (productTypeFilter !== 'all') {
            result = result.filter((product) => {
                const type = product.productType ?? 'product';
                if (productTypeFilter === 'product_and_supply') {
                    return type === 'product' || type === 'supply';
                }
                return type === productTypeFilter;
            });
        }

        return result;
    }, [
        flatCategoryIds,
        products,
        selectedCategoryId,
        showUncategorized,
        productTypeFilter,
    ]);

    const totalItems = filteredProducts.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

    // Keep the current page in range after the list shrinks (e.g. bulk delete).
    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const paginatedProducts = useMemo(() => {
        const start = (page - 1) * itemsPerPage;
        return filteredProducts.slice(start, start + itemsPerPage);
    }, [filteredProducts, page, itemsPerPage]);

    const displayedProducts = isMobile
        ? filteredProducts.slice(0, mobileCount)
        : paginatedProducts;

    useEffect(() => {
        if (!isMobile) return;
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (
                    entry.isIntersecting &&
                    mobileCount < filteredProducts.length
                ) {
                    setMobileCount((n) => n + 20);
                }
            },
            { threshold: 0.1 },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [isMobile, mobileCount, filteredProducts.length]);

    // Membership, not size: with pagination two different pages can share the
    // same length, so a size check would false-positive across pages and let a
    // header click clobber another page's selection.
    const allDisplayedSelected =
        displayedProducts.length > 0 &&
        displayedProducts.every((p) => selectedIds.has(p.id));

    const toggleSelectAll = () => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (allDisplayedSelected) {
                displayedProducts.forEach((p) => next.delete(p.id));
            } else {
                displayedProducts.forEach((p) => next.add(p.id));
            }
            return next;
        });
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

    const doBulkDelete = async () => {
        setConfirmBulkDelete(false);
        setBulkDeletePending(true);
        let failed = 0;
        for (const id of Array.from(selectedIds)) {
            try {
                await apiFetch(`/products/${id}`, { method: 'DELETE' });
            } catch {
                failed++;
            }
        }
        void queryClient.invalidateQueries({
            queryKey: ['warehouse-products'],
        });
        setBulkDeletePending(false);
        setSelectedIds(new Set());
        if (failed === 0) {
            toast.success('Produkty zostały usunięte');
        } else {
            toast.error(`Nie udało się usunąć ${failed} produkt(ów)`);
        }
    };

    const exportProductsCsv = () => {
        const formatCsvNumber = (value: number) =>
            value.toFixed(2).replace('.', ',');
        const header = [
            'Nazwa',
            'Kategoria',
            'Rodzaj produktu',
            'SKU',
            'Stan magazynowy',
            'Jednostka',
            'Cena sprzedaży',
            'VAT',
        ];
        const rows = filteredProducts.map((product) => [
            product.name,
            product.category?.name ?? 'brak kategorii',
            getProductTypeLabel(product.productType),
            product.sku ?? '',
            String(product.stock),
            product.unit ?? 'op.',
            formatCsvNumber(Number(product.unitPrice ?? 0)),
            `${Number(product.vatRate ?? 23)}%`,
        ]);
        const csv = [header, ...rows]
            .map((line) =>
                line
                    .map((value) => `"${String(value).replaceAll('"', '""')}"`)
                    .join(';'),
            )
            .join('\n');

        const blob = new Blob([`\uFEFF${csv}`], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'produkty-magazyn.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <Head>
                <title>Produkty — Salon Black &amp; White</title>
            </Head>
            <WarehouseLayout
                pageTitle="Magazyn / Produkty | SalonBW"
                heading="Magazyn / Produkty"
                activeTab="products"
            >
                <div className="row mb-3">
                    <div className="col-sm-4 col-lg-5 input-with-select-sm mb-s mb-md-0">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="wyszukaj produkt"
                            aria-label="Wyszukaj produkt"
                        />
                        <select
                            value={productTypeFilter}
                            aria-label="Rodzaj produktu"
                            onChange={(e) =>
                                setProductTypeFilter(
                                    e.target.value as ProductTypeFilter,
                                )
                            }
                        >
                            {productTypeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-sm-8 col-lg-7">
                        <div className="d-flex flex-wrap justify-content-end">
                            <Link
                                href="/sales/new"
                                className="btn btn-outline-secondary btn-sm ml-xs"
                            >
                                dodaj sprzedaż
                            </Link>
                            <Link
                                href="/use/new"
                                className="btn btn-outline-secondary btn-sm ml-xs"
                            >
                                dodaj zużycie
                            </Link>
                            <button
                                type="button"
                                className="btn btn-primary ml-xs"
                                onClick={() => setNewProductOpen(true)}
                            >
                                dodaj produkt
                            </button>
                        </div>
                    </div>
                </div>

                {selectedIds.size > 0 && (
                    <div className="d-flex align-items-center gap-2 mb-3 p-2 bg-light border rounded">
                        <span className="text-muted small">
                            Zaznaczono: <strong>{selectedIds.size}</strong>
                        </span>
                        <button
                            type="button"
                            className="btn btn-sm btn-danger ms-2"
                            disabled={bulkDeletePending}
                            onClick={() => setConfirmBulkDelete(true)}
                        >
                            {bulkDeletePending
                                ? 'Usuwanie...'
                                : 'Usuń zaznaczone'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setSelectedIds(new Set())}
                        >
                            Odznacz wszystkie
                        </button>
                    </div>
                )}

                <div className="table-responsive">
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th
                                    scope="col"
                                    className="pointer checkbox_container center_text"
                                >
                                    <input
                                        type="checkbox"
                                        aria-label="zaznacz wszystkie"
                                        checked={allDisplayedSelected}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th scope="col">
                                    <div>Nazwa</div>
                                </th>
                                <th scope="col">
                                    <div>Kategoria</div>
                                </th>
                                <th scope="col">
                                    <div>Rodzaj produktu</div>
                                </th>
                                <th scope="col">
                                    <div>Kod wewnętrzny (SKU)</div>
                                </th>
                                <th scope="col">
                                    <div>Stan magazynowy</div>
                                </th>
                                <th scope="col">
                                    <div>Cena sprzedaży</div>
                                </th>
                                <th
                                    className="col-actions-45"
                                    aria-label="Akcje"
                                />
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr className="odd">
                                    <td colSpan={8} className="products-empty">
                                        Ładowanie produktów...
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr className="odd">
                                    <td colSpan={8} className="products-empty">
                                        Brak produktów spełniających kryteria
                                    </td>
                                </tr>
                            ) : (
                                displayedProducts.map((product) => {
                                    const volume =
                                        Number(product.volumeMl ?? 0) > 0
                                            ? product.stock *
                                              Number(product.volumeMl)
                                            : 0;
                                    return (
                                        <tr key={product.id}>
                                            <td className="pointer checkbox_container center_text">
                                                <input
                                                    type="checkbox"
                                                    aria-label={`zaznacz ${product.name}`}
                                                    checked={selectedIds.has(
                                                        product.id,
                                                    )}
                                                    onChange={() =>
                                                        toggleSelect(product.id)
                                                    }
                                                />
                                            </td>
                                            <td className="wrap blue_text pointer link_body">
                                                <Link
                                                    href={`/products/${product.id}`}
                                                    className="inverse_decoration"
                                                >
                                                    {product.name}
                                                </Link>
                                            </td>
                                            <td>
                                                {product.category?.name ??
                                                    'brak kategorii'}
                                            </td>
                                            <td>
                                                {getProductTypeLabel(
                                                    product.productType,
                                                )}
                                            </td>
                                            <td>{product.sku ?? '-'}</td>
                                            <td>
                                                {product.stock}{' '}
                                                {product.unit ?? 'op.'}
                                                {volume > 0
                                                    ? ` (${volume} ml)`
                                                    : ' (0 ml)'}
                                            </td>
                                            <td>
                                                {Number(product.unitPrice ?? 0)
                                                    .toFixed(2)
                                                    .replace('.', ',')}
                                                &nbsp;zł
                                            </td>
                                            <td className="center_text">
                                                <Link
                                                    href={`/sales/new?product_id=${product.id}`}
                                                    className="icon_link stockroom_sell"
                                                    title="sprzedaj"
                                                >
                                                    <i
                                                        className="icon sprite-stock_action_sell"
                                                        aria-hidden="true"
                                                    />
                                                </Link>
                                                <Link
                                                    href={`/use/new?product_id=${product.id}`}
                                                    className="icon_link stockroom_consumption"
                                                    title="zużyj"
                                                >
                                                    <i
                                                        className="icon sprite-stock_action_consumption"
                                                        aria-hidden="true"
                                                    />
                                                </Link>
                                                <button
                                                    type="button"
                                                    className="icon_link btn btn-link p-0"
                                                    title="edytuj"
                                                    aria-label={`Edytuj produkt ${product.name}`}
                                                    onClick={() =>
                                                        setEditProductId(
                                                            product.id,
                                                        )
                                                    }
                                                >
                                                    <i
                                                        className="icon sprite-edit"
                                                        aria-hidden="true"
                                                    />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {isMobile && (
                    <div
                        ref={sentinelRef}
                        className="customers-infinite-sentinel"
                        aria-hidden="true"
                    >
                        {mobileCount < filteredProducts.length ? (
                            <p className="text-muted text-center small py-2">
                                Przewiń, aby załadować więcej
                            </p>
                        ) : null}
                    </div>
                )}

                {!isMobile && filteredProducts.length > 0 && (
                    <nav
                        className="pagination_container"
                        aria-label="Paginacja"
                    >
                        <div className="column_row">
                            <div className="row">
                                <div className="infocol-7">
                                    Pozycje od {(page - 1) * itemsPerPage + 1}{' '}
                                    do{' '}
                                    {Math.min(page * itemsPerPage, totalItems)}{' '}
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
                                            setPage(1);
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
                                    <button
                                        type="button"
                                        className="button button_prev mr-s"
                                        aria-label="Poprzednia strona"
                                        disabled={page <= 1}
                                        onClick={() =>
                                            setPage((p) => Math.max(1, p - 1))
                                        }
                                    >
                                        <span
                                            className="fc-icon fc-icon-left-single-arrow"
                                            aria-hidden="true"
                                        />
                                    </button>
                                    <input
                                        type="text"
                                        className="pagination-page-input"
                                        aria-label="Aktualna strona"
                                        value={page}
                                        onChange={(e) => {
                                            const next = Number(e.target.value);
                                            if (
                                                next >= 1 &&
                                                next <= totalPages
                                            ) {
                                                setPage(next);
                                            }
                                        }}
                                    />
                                    <span className="conjunction"> z </span>
                                    <span>{totalPages}</span>
                                    <button
                                        type="button"
                                        className="button button_next ml-s"
                                        aria-label="Następna strona"
                                        disabled={page >= totalPages}
                                        onClick={() =>
                                            setPage((p) =>
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
                        onClick={exportProductsCsv}
                        className="btn btn-outline-secondary"
                    >
                        <div
                            className="icon sprite-exel_blue mr-xs"
                            aria-hidden="true"
                        />
                        pobierz bazę produktów w pliku Excel
                    </button>
                </div>
                <NewProductModal
                    open={newProductOpen}
                    onClose={() => setNewProductOpen(false)}
                    onSuccess={() => setNewProductOpen(false)}
                />
                <EditProductModal
                    open={editProductId !== null}
                    productId={editProductId}
                    onClose={() => setEditProductId(null)}
                    onSuccess={() => setEditProductId(null)}
                    onDeleted={() => setEditProductId(null)}
                />
                <ConfirmModal
                    open={confirmBulkDelete}
                    title="Usuń zaznaczone produkty"
                    message={`Czy na pewno chcesz usunąć ${selectedIds.size} produkt(ów)? Operacja jest nieodwracalna.`}
                    confirmLabel="Usuń"
                    confirmVariant="danger"
                    onConfirm={() => void doBulkDelete()}
                    onCancel={() => setConfirmBulkDelete(false)}
                />
            </WarehouseLayout>
        </>
    );
}
