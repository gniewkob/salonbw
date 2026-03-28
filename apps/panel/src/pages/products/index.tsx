'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import {
    useWarehouseProducts,
    useProductCategories,
} from '@/hooks/useWarehouseViews';
import { getProductTypeLabel } from '@/lib/warehouse/productTypeLabel';
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
        <WarehouseLayout
            pageTitle="Magazyn / Produkty | SalonBW"
            heading="Magazyn / Produkty"
            activeTab="products"
        >
            <div className="row mb-l">
                <div className="col-sm-4 col-lg-5 input-with-select-sm mb-s mb-md-0">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="wyszukaj produkt"
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
                    <div className="d-flex flex-wrap jc-end">
                        <Link href="/sales/new" className="button ml-xs">
                            dodaj sprzedaż
                        </Link>
                        <Link href="/use/new" className="button ml-xs">
                            dodaj zużycie
                        </Link>
                        <Link
                            href="/products/new"
                            className="button button-blue ml-xs"
                        >
                            dodaj produkt
                        </Link>
                    </div>
                </div>
            </div>

            <div className="column_row data_table">
                <table className="table-bordered">
                    <thead>
                        <tr>
                            <th className="pointer checkbox_container center_text">
                                <input
                                    type="checkbox"
                                    aria-label="zaznacz wszystkie"
                                />
                            </th>
                            <th>Nazwa</th>
                            <th>Kategoria</th>
                            <th>Rodzaj produktu</th>
                            <th>Kod wewnętrzny (SKU)</th>
                            <th>Stan magazynowy</th>
                            <th>Cena sprzedaży</th>
                            <th className="col-actions-45" aria-label="Akcje" />
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
                            filteredProducts.map((product) => {
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
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="products-export">
                <button
                    type="button"
                    onClick={exportProductsCsv}
                    className="button"
                >
                    <div
                        className="icon sprite-exel_blue mr-xs"
                        aria-hidden="true"
                    />
                    pobierz bazę produktów w pliku Excel
                </button>
            </div>
        </WarehouseLayout>
    );
}
