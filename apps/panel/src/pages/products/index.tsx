'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import VersumCustomersVendorCss from '@/components/versum/VersumCustomersVendorCss';
import { useAuth } from '@/contexts/AuthContext';
import {
    useWarehouseProducts,
    useProductCategories,
} from '@/hooks/useWarehouseViews';
import { ProductCategory } from '@/types';

function flattenCategoryIds(
    nodes: ProductCategory[],
    targetId: number,
): number[] {
    const out: number[] = [];

    const findNode = (arr: ProductCategory[]) => {
        for (const node of arr) {
            if (node.id === targetId) {
                collect(node.children || []);
                return true;
            }
            if (node.children) {
                if (findNode(node.children)) return true;
            }
        }
        return false;
    };

    const collect = (arr: ProductCategory[]) => {
        for (const node of arr) {
            out.push(node.id);
            if (node.children) collect(node.children);
        }
    };

    findNode(nodes);
    return out;
}

type ProductTypeFilter = 'all' | 'product_and_supply' | 'product' | 'supply';

const productTypeOptions: { value: ProductTypeFilter; label: string }[] = [
    { value: 'all', label: 'wszystkie produkty' },
    { value: 'product_and_supply', label: 'towar i materiał' },
    { value: 'product', label: 'towar' },
    { value: 'supply', label: 'materiał' },
];

export default function WarehouseProductsPage() {
    const { role } = useAuth();
    const router = useRouter();

    const [search, setSearch] = useState('');
    const [productTypeFilter, setProductTypeFilter] =
        useState<ProductTypeFilter>('all');
    const selectedCategoryId = router.query.categoryId
        ? Number(router.query.categoryId)
        : undefined;
    const showUncategorized = router.query.uncategorized === 'true';

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

    const exportProductsCsv = () => {
        const header = [
            'Nazwa',
            'Kategoria',
            'Rodzaj produktu',
            'SKU',
            'Stan magazynowy',
            'Cena sprzedaży',
            'VAT',
        ];
        const rows = filteredProducts.map((product) => [
            product.name,
            product.category?.name ?? 'brak kategorii',
            product.productType ?? 'product',
            product.sku ?? '',
            `${product.stock} ${product.unit ?? 'op.'}`,
            Number(product.unitPrice ?? 0).toFixed(2),
            `${Number(product.vatRate ?? 23)}%`,
        ]);
        const csv = [header, ...rows]
            .map((line) =>
                line
                    .map((value) => `"${String(value).replaceAll('"', '""')}"`)
                    .join(','),
            )
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'produkty-magazyn.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:warehouse">
            <VersumShell role={role}>
                <VersumCustomersVendorCss />
                <div className="products_index" id="products_main">
                    <ul className="breadcrumb">
                        <li>Magazyn / Produkty</li>
                    </ul>

                    <div className="products-top-tabs">
                        <Link href="/products" className="active">
                            produkty
                        </Link>
                        <Link href="/sales/history">sprzedaż</Link>
                        <Link href="/use/history">zużycie</Link>
                        <Link href="/deliveries/history">dostawy</Link>
                        <Link href="/orders/history">zamówienia</Link>
                        <Link
                            href="/inventory"
                            className="products-top-tabs__right"
                        >
                            inwentaryzacja
                        </Link>
                    </div>

                    <div className="products-toolbar">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="wyszukaj produkt"
                            className="versum-input"
                        />
                        <select
                            value={productTypeFilter}
                            onChange={(e) =>
                                setProductTypeFilter(
                                    e.target.value as ProductTypeFilter,
                                )
                            }
                            className="versum-select"
                        >
                            {productTypeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <div className="products-toolbar__actions">
                            <Link
                                href="/sales/new"
                                className="btn btn-default btn-xs"
                            >
                                dodaj sprzedaż
                            </Link>
                            <Link
                                href="/use/new"
                                className="btn btn-default btn-xs"
                            >
                                dodaj zużycie
                            </Link>
                            <Link
                                href="/products/new"
                                className="btn btn-primary btn-xs"
                            >
                                dodaj produkt
                            </Link>
                        </div>
                    </div>

                    <div className="products-table-wrap">
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th className="col-checkbox">
                                        <input type="checkbox" />
                                    </th>
                                    <th className="col-name">Nazwa</th>
                                    <th>Kategoria</th>
                                    <th>Rodzaj produktu</th>
                                    <th>Kod wewnętrzny (SKU)</th>
                                    <th>Stan magazynowy</th>
                                    <th>Cena sprzedaży</th>
                                    <th className="col-actions"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="products-empty"
                                        >
                                            Ładowanie produktów...
                                        </td>
                                    </tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="products-empty"
                                        >
                                            Brak produktów spełniających
                                            kryteria
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => {
                                        const volume =
                                            Number(product.volumeMl ?? 0) > 0
                                                ? product.stock *
                                                  Number(product.volumeMl)
                                                : 0;
                                        return (
                                            <tr key={product.id}>
                                                <td className="col-checkbox">
                                                    <input type="checkbox" />
                                                </td>
                                                <td className="col-name">
                                                    <Link
                                                        href={`/products/${product.id}`}
                                                    >
                                                        {product.name}
                                                    </Link>
                                                </td>
                                                <td>
                                                    {product.category?.name ??
                                                        'brak kategorii'}
                                                </td>
                                                <td>
                                                    {product.productType ??
                                                        'towar'}
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
                                                    {Number(
                                                        product.unitPrice ?? 0,
                                                    ).toFixed(2)}{' '}
                                                    zł
                                                </td>
                                                <td className="col-actions">
                                                    <Link
                                                        href={`/sales/new?product_id=${product.id}`}
                                                        title="dodaj sprzedaż"
                                                        className="products-action-link"
                                                    >
                                                        <i
                                                            className="fa fa-shopping-cart"
                                                            aria-hidden="true"
                                                        />
                                                    </Link>
                                                    <Link
                                                        href={`/use/new?product_id=${product.id}`}
                                                        title="dodaj zużycie"
                                                        className="products-action-link"
                                                    >
                                                        <i
                                                            className="fa fa-download"
                                                            aria-hidden="true"
                                                        />
                                                    </Link>
                                                    <Link
                                                        href={`/products/${product.id}/edit`}
                                                        title="edytuj produkt"
                                                        className="products-action-link"
                                                    >
                                                        <i
                                                            className="fa fa-pencil"
                                                            aria-hidden="true"
                                                        />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="products-pagination">
                        <span>
                            Pozycje od 1 do {filteredProducts.length} z{' '}
                            {filteredProducts.length}
                        </span>
                        <span>|</span>
                        <span>na stronie</span>
                        <select defaultValue="20">
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                        <div className="products-pagination-nav">
                            <input value="1" readOnly />
                            <span>z 1</span>
                            <button type="button">›</button>
                        </div>
                    </div>

                    <div className="products-export">
                        <button
                            type="button"
                            onClick={exportProductsCsv}
                            className="link-excel"
                        >
                            pobierz bazę produktów w pliku Excel
                        </button>
                    </div>
                </div>
            </VersumShell>
        </RouteGuard>
    );
}
