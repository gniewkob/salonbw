'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';
import {
    useWarehouseProducts,
    useProductCategories,
} from '@/hooks/useWarehouseViews';
import { useProductApi } from '@/api/products';
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
    const queryClient = useQueryClient();
    const productApi = useProductApi();

    const [search, setSearch] = useState('');
    const [productTypeFilter, setProductTypeFilter] =
        useState<ProductTypeFilter>('all');
    const selectedCategoryId = router.query.categoryId
        ? Number(router.query.categoryId)
        : undefined;

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        brand: '',
        unitPrice: '0',
        stock: '0',
        vatRate: '23',
        minQuantity: '0',
    });

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
        if (selectedCategoryId) {
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
    }, [flatCategoryIds, products, selectedCategoryId, productTypeFilter]);

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

    const handleCreateProduct = async () => {
        if (!newProduct.name.trim()) return;
        await productApi.create({
            name: newProduct.name.trim(),
            brand: newProduct.brand.trim() || undefined,
            unitPrice: Number(newProduct.unitPrice),
            stock: Number(newProduct.stock),
            vatRate: Number(newProduct.vatRate),
            minQuantity: Number(newProduct.minQuantity),
        });
        setIsCreateOpen(false);
        setNewProduct({
            name: '',
            brand: '',
            unitPrice: '0',
            stock: '0',
            vatRate: '23',
            minQuantity: '0',
        });
        await queryClient.invalidateQueries({
            queryKey: ['warehouse-products'],
        });
    };

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:warehouse">
            <VersumShell role={role}>
                <div className="products-page">
                    {/* Breadcrumbs */}
                    <ul className="breadcrumb">
                        <li>
                            <Link href="/products">Magazyn</Link>
                        </li>
                        <li className="active">/ Produkty</li>
                    </ul>

                    {/* Tabs - jak w Versum */}
                    <div className="products-tabs">
                        <Link href="/products" className="products-tab active">
                            Produkty
                        </Link>
                        <Link href="/sales/history" className="products-tab">
                            Sprzedaż
                        </Link>
                        <Link href="/use/history" className="products-tab">
                            Zużycie
                        </Link>
                        <Link
                            href="/deliveries/history"
                            className="products-tab"
                        >
                            Dostawy
                        </Link>
                        <Link href="/orders/history" className="products-tab">
                            Zamówienia
                        </Link>
                        <Link
                            href="/inventory"
                            className="products-tab products-tab--right"
                        >
                            Inwentaryzacja
                        </Link>
                    </div>

                    {/* Toolbar */}
                    <div className="products-toolbar">
                        <div className="products-search">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="wyszukaj produkt"
                                className="versum-input"
                            />
                        </div>
                        <div className="products-filter">
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
                        </div>
                        <div className="products-actions">
                            <Link
                                href="/sales/new"
                                className="versum-btn versum-btn--secondary"
                            >
                                dodaj sprzedaż
                            </Link>
                            <Link
                                href="/use/new"
                                className="versum-btn versum-btn--secondary"
                            >
                                dodaj zużycie
                            </Link>
                            <Link
                                href="/products/new"
                                className="versum-btn versum-btn--primary"
                            >
                                dodaj produkt
                            </Link>
                        </div>
                    </div>

                    {/* Table */}
                    {isLoading ? (
                        <div className="products-loading">
                            Ładowanie produktów...
                        </div>
                    ) : (
                        <>
                            <div className="products-table-wrap">
                                <table className="products-table">
                                    <thead>
                                        <tr>
                                            <th className="col-checkbox">
                                                <input type="checkbox" />
                                            </th>
                                            <th className="col-name">
                                                <Link href="/products?sort_by=name&order=desc">
                                                    Nazwa
                                                </Link>
                                            </th>
                                            <th>Kategoria</th>
                                            <th>Rodzaj produktu</th>
                                            <th>Kod wewnętrzny (SKU)</th>
                                            <th>
                                                <Link href="/products?sort_by=stock&order=asc">
                                                    Stan magazynowy
                                                </Link>
                                            </th>
                                            <th>
                                                <Link href="/products?sort_by=price&order=asc">
                                                    Cena sprzedaży
                                                </Link>
                                            </th>
                                            <th className="col-actions"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.length > 0 ? (
                                            filteredProducts.map((product) => (
                                                <tr key={product.id}>
                                                    <td>
                                                        <input type="checkbox" />
                                                    </td>
                                                    <td>
                                                        <Link
                                                            href={`/products/${product.id}`}
                                                            className="product-name-link"
                                                        >
                                                            {product.name}
                                                        </Link>
                                                    </td>
                                                    <td>
                                                        {product.category
                                                            ?.name ??
                                                            'brak kategorii'}
                                                    </td>
                                                    <td>
                                                        {product.productType ??
                                                            'towar'}
                                                    </td>
                                                    <td>
                                                        {product.sku ?? '-'}
                                                    </td>
                                                    <td>
                                                        {product.stock}{' '}
                                                        {product.unit ?? 'op.'}{' '}
                                                        (
                                                        {product.stock *
                                                            (product.volumeMl ??
                                                                0)}{' '}
                                                        ml)
                                                    </td>
                                                    <td>
                                                        {Number(
                                                            product.unitPrice ??
                                                                0,
                                                        ).toFixed(2)}{' '}
                                                        zł
                                                    </td>
                                                    <td className="col-actions">
                                                        <Link
                                                            href={`/sales/new?product_id=${product.id}`}
                                                            className="action-link"
                                                            title="Sprzedaj"
                                                        >
                                                            🛒
                                                        </Link>
                                                        <Link
                                                            href={`/use/new?product_id=${product.id}`}
                                                            className="action-link"
                                                            title="Zużyj"
                                                        >
                                                            📦
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={8}
                                                    className="text-center text-muted"
                                                >
                                                    Brak produktów spełniających
                                                    kryteria
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="products-pagination">
                                <span>
                                    Pozycje od 1 do {filteredProducts.length} z{' '}
                                    {filteredProducts.length}
                                </span>
                                <span className="separator">|</span>
                                <label>
                                    na stronie
                                    <select className="versum-select">
                                        <option>10 wyników</option>
                                        <option selected>20 wyników</option>
                                        <option>50 wyników</option>
                                        <option>100 wyników</option>
                                    </select>
                                </label>
                                <div className="pagination-nav">
                                    <input
                                        type="text"
                                        value="1"
                                        className="versum-input versum-input--small"
                                        readOnly
                                    />
                                    <span>z</span>
                                    <span>1</span>
                                    <button className="versum-btn versum-btn--icon">
                                        ›
                                    </button>
                                </div>
                            </div>

                            {/* Export link */}
                            <div className="products-export">
                                <button
                                    onClick={exportProductsCsv}
                                    className="link-excel"
                                >
                                    📊 pobierz bazę produktów w pliku Excel
                                </button>
                            </div>
                        </>
                    )}

                    {/* Create Modal */}
                    {isCreateOpen && (
                        <div className="modal-overlay">
                            <div className="modal">
                                <h2>Dodaj produkt</h2>
                                <div className="modal-body">
                                    <label>
                                        Nazwa
                                        <input
                                            type="text"
                                            value={newProduct.name}
                                            onChange={(e) =>
                                                setNewProduct((prev) => ({
                                                    ...prev,
                                                    name: e.target.value,
                                                }))
                                            }
                                        />
                                    </label>
                                    <label>
                                        Marka
                                        <input
                                            type="text"
                                            value={newProduct.brand}
                                            onChange={(e) =>
                                                setNewProduct((prev) => ({
                                                    ...prev,
                                                    brand: e.target.value,
                                                }))
                                            }
                                        />
                                    </label>
                                    <label>
                                        Cena brutto
                                        <input
                                            type="number"
                                            value={newProduct.unitPrice}
                                            onChange={(e) =>
                                                setNewProduct((prev) => ({
                                                    ...prev,
                                                    unitPrice: e.target.value,
                                                }))
                                            }
                                        />
                                    </label>
                                    <label>
                                        Stan
                                        <input
                                            type="number"
                                            value={newProduct.stock}
                                            onChange={(e) =>
                                                setNewProduct((prev) => ({
                                                    ...prev,
                                                    stock: e.target.value,
                                                }))
                                            }
                                        />
                                    </label>
                                    <label>
                                        VAT (%)
                                        <input
                                            type="number"
                                            value={newProduct.vatRate}
                                            onChange={(e) =>
                                                setNewProduct((prev) => ({
                                                    ...prev,
                                                    vatRate: e.target.value,
                                                }))
                                            }
                                        />
                                    </label>
                                    <label>
                                        Minimalny stan
                                        <input
                                            type="number"
                                            value={newProduct.minQuantity}
                                            onChange={(e) =>
                                                setNewProduct((prev) => ({
                                                    ...prev,
                                                    minQuantity: e.target.value,
                                                }))
                                            }
                                        />
                                    </label>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        onClick={() => setIsCreateOpen(false)}
                                        className="versum-btn"
                                    >
                                        anuluj
                                    </button>
                                    <button
                                        onClick={() =>
                                            void handleCreateProduct()
                                        }
                                        className="versum-btn versum-btn--primary"
                                    >
                                        zapisz
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </VersumShell>
        </RouteGuard>
    );
}
