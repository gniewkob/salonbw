'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useRouter } from 'next/router';
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

    // First find the target node
    const findNode = (arr: ProductCategory[]) => {
        for (const node of arr) {
            if (node.id === targetId) {
                // Found it, now collect all children
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

export default function WarehouseProductsPage() {
    return <WarehouseProductsPageContent />;
}

function WarehouseProductsPageContent() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const productApi = useProductApi();

    const [search, setSearch] = useState('');
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
    // Fetch all products or filtered by search.
    // We do client-side category filtering to support nested categories correctly if API doesn't.
    // Assuming useWarehouseProducts supports searching.
    const { data: products = [], isLoading } = useWarehouseProducts({
        search: search || undefined,
        // We might need to pass categoryId if API supports nested filtering,
        // but existing logic used client-side flatten. Let's keep existing logic safe:
        // fetch by search, then filter. Or if API is paginated, this is risky.
        // Assuming fetch-all for now as per previous code.
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
        if (!selectedCategoryId) return products;
        return products.filter((product) => {
            if (!product.categoryId) return false;
            return (
                product.categoryId === selectedCategoryId ||
                flatCategoryIds.includes(product.categoryId)
            );
        });
    }, [flatCategoryIds, products, selectedCategoryId]);

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

    const actions = (
        <div className="flex flex-wrap justify-end gap-2">
            <Link
                href="/sales/new"
                className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white hover:bg-sky-600"
            >
                dodaj sprzedaż
            </Link>
            <Link
                href="/use/new"
                className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white hover:bg-sky-600"
            >
                dodaj zużycie
            </Link>
            <button
                type="button"
                className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white hover:bg-sky-600"
                onClick={() => setIsCreateOpen(true)}
            >
                dodaj produkt
            </button>
        </div>
    );

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Produkty | SalonBW"
            heading="Magazyn / Produkty"
            activeTab="products"
            actions={actions}
        >
            <div className="versum-page__toolbar">
                <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="wyszukaj produkt"
                    className="versum-input w-[280px]"
                />
                <button
                    type="button"
                    className="versum-button versum-button--light"
                    onClick={exportProductsCsv}
                >
                    pobierz bazę produktów w pliku Excel
                </button>
            </div>

            {isLoading ? (
                <p className="p-4 text-sm versum-muted">
                    Ładowanie produktów...
                </p>
            ) : (
                <>
                    <div className="versum-table-wrap">
                        <table className="versum-table">
                            <thead>
                                <tr>
                                    <th>Nazwa</th>
                                    <th>Kategoria</th>
                                    <th>Rodzaj produktu</th>
                                    <th>Kod wewnętrzny (SKU)</th>
                                    <th>Stan magazynowy</th>
                                    <th>Cena sprzedaży</th>
                                    <th>Akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((product) => (
                                        <tr key={product.id}>
                                            <td>
                                                <Link
                                                    href={`/products/${product.id}`}
                                                    className="text-sky-600 hover:underline"
                                                >
                                                    {product.name}
                                                </Link>
                                            </td>
                                            <td>
                                                {product.category?.name ??
                                                    'brak kategorii'}
                                            </td>
                                            <td>
                                                {product.productType ?? 'towar'}
                                            </td>
                                            <td>{product.sku ?? '-'}</td>
                                            <td>
                                                {product.stock}{' '}
                                                {product.unit ?? 'op.'}
                                            </td>
                                            <td>
                                                {Number(
                                                    product.unitPrice ?? 0,
                                                ).toFixed(2)}{' '}
                                                zł
                                            </td>
                                            <td>
                                                <Link
                                                    href="/sales/new"
                                                    className="text-sky-600 hover:underline"
                                                >
                                                    sprzedaj
                                                </Link>
                                                {' · '}
                                                <Link
                                                    href="/use/new"
                                                    className="text-sky-600 hover:underline"
                                                >
                                                    zużyj
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="p-4 text-center versum-muted"
                                        >
                                            Brak produktów spełniających
                                            kryteria
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="border-t border-gray-300 bg-white px-3 py-2 text-xs text-gray-600">
                        Pozycje od 1 do {filteredProducts.length} | na stronie
                        20
                    </div>
                </>
            )}

            {isCreateOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45">
                    <div className="w-full max-w-xl rounded border border-gray-300 bg-white p-4 shadow-lg">
                        <h2 className="mb-3 text-lg font-semibold">
                            Dodaj produkt
                        </h2>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <label className="col-span-2">
                                <span className="mb-1 block">Nazwa</span>
                                <input
                                    type="text"
                                    value={newProduct.name}
                                    onChange={(event) =>
                                        setNewProduct((prev) => ({
                                            ...prev,
                                            name: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded border border-gray-300 px-2 py-1.5"
                                />
                            </label>
                            <label>
                                <span className="mb-1 block">Marka</span>
                                <input
                                    type="text"
                                    value={newProduct.brand}
                                    onChange={(event) =>
                                        setNewProduct((prev) => ({
                                            ...prev,
                                            brand: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded border border-gray-300 px-2 py-1.5"
                                />
                            </label>
                            <label>
                                <span className="mb-1 block">Cena brutto</span>
                                <input
                                    type="number"
                                    value={newProduct.unitPrice}
                                    onChange={(event) =>
                                        setNewProduct((prev) => ({
                                            ...prev,
                                            unitPrice: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded border border-gray-300 px-2 py-1.5"
                                />
                            </label>
                            <label>
                                <span className="mb-1 block">Stan</span>
                                <input
                                    type="number"
                                    value={newProduct.stock}
                                    onChange={(event) =>
                                        setNewProduct((prev) => ({
                                            ...prev,
                                            stock: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded border border-gray-300 px-2 py-1.5"
                                />
                            </label>
                            <label>
                                <span className="mb-1 block">VAT (%)</span>
                                <input
                                    type="number"
                                    value={newProduct.vatRate}
                                    onChange={(event) =>
                                        setNewProduct((prev) => ({
                                            ...prev,
                                            vatRate: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded border border-gray-300 px-2 py-1.5"
                                />
                            </label>
                            <label>
                                <span className="mb-1 block">
                                    Minimalny stan
                                </span>
                                <input
                                    type="number"
                                    value={newProduct.minQuantity}
                                    onChange={(event) =>
                                        setNewProduct((prev) => ({
                                            ...prev,
                                            minQuantity: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded border border-gray-300 px-2 py-1.5"
                                />
                            </label>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                className="rounded border border-gray-300 px-3 py-1.5 text-sm"
                                onClick={() => setIsCreateOpen(false)}
                            >
                                anuluj
                            </button>
                            <button
                                type="button"
                                className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white"
                                onClick={() => void handleCreateProduct()}
                            >
                                zapisz
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </WarehouseLayout>
    );
}
