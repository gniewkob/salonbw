'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import WarehouseCategoriesPanel from '@/components/warehouse/WarehouseCategoriesPanel';
import { useWarehouseProducts, useProductCategories } from '@/hooks/useWarehouseViews';
import { useProductApi } from '@/api/products';

function flattenCategoryIds(
    nodes: Array<{ id: number; children?: Array<{ id: number; children?: unknown[] }> }>,
): number[] {
    const out: number[] = [];
    const walk = (arr: Array<{ id: number; children?: Array<{ id: number; children?: unknown[] }> }>) => {
        for (const node of arr) {
            out.push(node.id);
            if (node.children && node.children.length > 0) {
                walk(node.children as Array<{ id: number; children?: Array<{ id: number; children?: unknown[] }> }>);
            }
        }
    };
    walk(nodes);
    return out;
}

export default function WarehouseProductsPage() {
    const queryClient = useQueryClient();
    const productApi = useProductApi();

    const [search, setSearch] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
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
        categoryId: selectedCategoryId,
        includeInactive: true,
    });

    const flatCategoryIds = useMemo(() => flattenCategoryIds(categories), [categories]);

    const filteredProducts = useMemo(() => {
        if (!selectedCategoryId) return products;
        return products.filter((product) => {
            if (!product.categoryId) return false;
            return product.categoryId === selectedCategoryId || flatCategoryIds.includes(product.categoryId);
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
            .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
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
        await queryClient.invalidateQueries({ queryKey: ['warehouse-products'] });
    };

    const actions = (
        <div className="flex flex-wrap justify-end gap-2">
            <Link href="/sales/new" className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white hover:bg-sky-600">
                dodaj sprzedaż
            </Link>
            <Link href="/use/new" className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white hover:bg-sky-600">
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
            leftPanel={
                <WarehouseCategoriesPanel
                    categories={categories}
                    selectedCategoryId={selectedCategoryId}
                    onSelect={setSelectedCategoryId}
                />
            }
        >
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="wyszukaj produkt"
                    className="w-[280px] rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
                <button
                    type="button"
                    className="rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={exportProductsCsv}
                >
                    pobierz bazę produktów w pliku Excel
                </button>
            </div>

            {isLoading ? (
                <p className="py-8 text-sm text-gray-500">Ładowanie produktów...</p>
            ) : (
                <>
                    <div className="overflow-x-auto border border-gray-200">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100 text-left text-xs uppercase text-gray-600">
                                <tr>
                                    <th className="px-3 py-2">Nazwa</th>
                                    <th className="px-3 py-2">Kategoria</th>
                                    <th className="px-3 py-2">Rodzaj produktu</th>
                                    <th className="px-3 py-2">Kod wewnętrzny (SKU)</th>
                                    <th className="px-3 py-2">Stan magazynowy</th>
                                    <th className="px-3 py-2">Cena sprzedaży</th>
                                    <th className="px-3 py-2">Akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="border-t border-gray-200 hover:bg-gray-50">
                                        <td className="px-3 py-2 font-semibold text-sky-600">
                                            <Link href={`/products/${product.id}`}>{product.name}</Link>
                                        </td>
                                        <td className="px-3 py-2">{product.category?.name ?? 'brak kategorii'}</td>
                                        <td className="px-3 py-2">{product.productType ?? 'towar'}</td>
                                        <td className="px-3 py-2">{product.sku ?? '-'}</td>
                                        <td className="px-3 py-2">
                                            {product.stock} {product.unit ?? 'op.'}
                                        </td>
                                        <td className="px-3 py-2">{Number(product.unitPrice ?? 0).toFixed(2)} zł</td>
                                        <td className="px-3 py-2 text-xs">
                                            <Link href="/sales/new" className="text-sky-500 hover:text-sky-700">
                                                sprzedaj
                                            </Link>
                                            {' · '}
                                            <Link href="/use/new" className="text-sky-500 hover:text-sky-700">
                                                zużyj
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-3 text-sm text-gray-500">
                        Pozycje od 1 do {filteredProducts.length} | na stronie 20
                    </div>
                </>
            )}

            {isCreateOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45">
                    <div className="w-full max-w-xl rounded border border-gray-300 bg-white p-4 shadow-lg">
                        <h2 className="mb-3 text-lg font-semibold">Dodaj produkt</h2>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <label className="col-span-2">
                                <span className="mb-1 block">Nazwa</span>
                                <input
                                    type="text"
                                    value={newProduct.name}
                                    onChange={(event) =>
                                        setNewProduct((prev) => ({ ...prev, name: event.target.value }))
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
                                        setNewProduct((prev) => ({ ...prev, brand: event.target.value }))
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
                                        setNewProduct((prev) => ({ ...prev, unitPrice: event.target.value }))
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
                                        setNewProduct((prev) => ({ ...prev, stock: event.target.value }))
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
                                        setNewProduct((prev) => ({ ...prev, vatRate: event.target.value }))
                                    }
                                    className="w-full rounded border border-gray-300 px-2 py-1.5"
                                />
                            </label>
                            <label>
                                <span className="mb-1 block">Minimalny stan</span>
                                <input
                                    type="number"
                                    value={newProduct.minQuantity}
                                    onChange={(event) =>
                                        setNewProduct((prev) => ({ ...prev, minQuantity: event.target.value }))
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
