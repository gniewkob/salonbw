'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import VersumCustomersVendorCss from '@/components/versum/VersumCustomersVendorCss';
import { useAuth } from '@/contexts/AuthContext';
import { useProductApi } from '@/api/products';
import { useProductCategories } from '@/hooks/useWarehouseViews';
import type { ProductExtended } from '@/types';

export default function EditProductPage() {
    const { role, apiFetch } = useAuth();
    const router = useRouter();
    const productApi = useProductApi();
    const { data: categories = [] } = useProductCategories();
    const productId = useMemo(() => {
        const value = router.query.id;
        const parsed = Number(Array.isArray(value) ? value[0] : value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }, [router.query.id]);
    const [isSaving, setIsSaving] = useState(false);

    const { data: product, isLoading } = useQuery<ProductExtended>({
        queryKey: ['product-edit', productId],
        enabled: Boolean(productId),
        queryFn: async () =>
            apiFetch<ProductExtended>(`/products/${productId}`),
    });

    const [form, setForm] = useState({
        name: '',
        categoryId: '',
        productType: 'product',
        sku: '',
        stock: '0',
        unitPrice: '0',
        vatRate: '23',
        brand: '',
        minQuantity: '0',
        unit: 'op.',
        description: '',
    });

    useEffect(() => {
        if (!product) return;
        setForm({
            name: String(product.name ?? ''),
            categoryId: product.categoryId ? String(product.categoryId) : '',
            productType: String(product.productType ?? 'product'),
            sku: String(product.sku ?? ''),
            stock: String(product.stock ?? 0),
            unitPrice: String(product.unitPrice ?? 0),
            vatRate: String(product.vatRate ?? 23),
            brand: String(product.brand ?? ''),
            minQuantity: String(
                product.minQuantity ?? product.lowStockThreshold ?? 0,
            ),
            unit: String(product.unit ?? 'op.'),
            description: String(product.description ?? ''),
        });
    }, [product]);

    if (!role) return null;

    const handleSubmit = async () => {
        if (!productId || !form.name.trim()) return;
        setIsSaving(true);
        try {
            await productApi.update(productId, {
                name: form.name.trim(),
                unitPrice: Number(form.unitPrice),
                stock: Number(form.stock),
                vatRate: Number(form.vatRate),
                brand: form.brand.trim() || undefined,
                minQuantity: Number(form.minQuantity),
            });
            await apiFetch(`/products/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    categoryId: form.categoryId
                        ? Number(form.categoryId)
                        : null,
                    productType: form.productType,
                    sku: form.sku.trim() || null,
                    unit: form.unit.trim() || null,
                    description: form.description.trim() || null,
                }),
            });
            await router.push(`/products/${productId}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <RouteGuard roles={['admin']} permission="nav:warehouse">
            <VersumShell role={role}>
                <VersumCustomersVendorCss />
                <div className="products_index" id="products_main">
                    <ul className="breadcrumb">
                        <li>
                            Magazyn / Produkty /{' '}
                            {product?.name ?? `#${productId ?? ''}`} / Edytuj
                        </li>
                    </ul>

                    {isLoading ? (
                        <p className="products-empty">Ładowanie produktu...</p>
                    ) : (
                        <form
                            className="product-form"
                            onSubmit={(event) => {
                                event.preventDefault();
                                void handleSubmit();
                            }}
                        >
                            <div className="product-form__section">
                                <h4>dane podstawowe</h4>

                                <div className="product-form__row">
                                    <label htmlFor="name">1. Nazwa</label>
                                    <input
                                        id="name"
                                        className="form-control"
                                        value={form.name}
                                        onChange={(event) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                name: event.target.value,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="product-form__row">
                                    <label htmlFor="category">
                                        2. Kategoria
                                    </label>
                                    <select
                                        id="category"
                                        className="versum-select"
                                        value={form.categoryId}
                                        onChange={(event) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                categoryId: event.target.value,
                                            }))
                                        }
                                    >
                                        <option value="">brak kategorii</option>
                                        {categories.map((category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="product-form__row">
                                    <label htmlFor="productType">
                                        3. Rodzaj produktu
                                    </label>
                                    <select
                                        id="productType"
                                        className="versum-select"
                                        value={form.productType}
                                        onChange={(event) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                productType: event.target.value,
                                            }))
                                        }
                                    >
                                        <option value="product">towar</option>
                                        <option value="supply">materiał</option>
                                        <option value="universal">
                                            uniwersalny
                                        </option>
                                    </select>
                                </div>

                                <div className="product-form__row">
                                    <label htmlFor="sku">
                                        4. Kod wewnętrzny (SKU)
                                    </label>
                                    <input
                                        id="sku"
                                        className="form-control"
                                        value={form.sku}
                                        onChange={(event) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                sku: event.target.value,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="product-form__row">
                                    <label htmlFor="stock">
                                        5. Stan magazynowy
                                    </label>
                                    <input
                                        id="stock"
                                        type="number"
                                        className="form-control"
                                        value={form.stock}
                                        onChange={(event) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                stock: event.target.value,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="product-form__row">
                                    <label htmlFor="unitPrice">
                                        6. Cena sprzedaży brutto
                                    </label>
                                    <input
                                        id="unitPrice"
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        value={form.unitPrice}
                                        onChange={(event) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                unitPrice: event.target.value,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="product-form__row">
                                    <label htmlFor="vatRate">7. VAT (%)</label>
                                    <input
                                        id="vatRate"
                                        type="number"
                                        className="form-control"
                                        value={form.vatRate}
                                        onChange={(event) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                vatRate: event.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="product-form__section">
                                <h4>dane rozszerzone</h4>

                                <div className="product-form__row">
                                    <label htmlFor="brand">8. Producent</label>
                                    <input
                                        id="brand"
                                        className="form-control"
                                        value={form.brand}
                                        onChange={(event) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                brand: event.target.value,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="product-form__row">
                                    <label htmlFor="minQuantity">
                                        9. Minimalny stan magazynowy
                                    </label>
                                    <input
                                        id="minQuantity"
                                        type="number"
                                        className="form-control"
                                        value={form.minQuantity}
                                        onChange={(event) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                minQuantity: event.target.value,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="product-form__row">
                                    <label htmlFor="unit">10. Jednostka</label>
                                    <input
                                        id="unit"
                                        className="form-control"
                                        value={form.unit}
                                        onChange={(event) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                unit: event.target.value,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="product-form__row">
                                    <label htmlFor="description">
                                        11. Opis
                                    </label>
                                    <textarea
                                        id="description"
                                        className="form-control"
                                        rows={3}
                                        value={form.description}
                                        onChange={(event) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                description: event.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="product-form__actions">
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-xs"
                                    disabled={isSaving}
                                >
                                    {isSaving
                                        ? 'zapisywanie...'
                                        : 'zapisz zmiany'}
                                </button>
                                <Link
                                    href={`/products/${productId ?? ''}`}
                                    className="btn btn-default btn-xs"
                                >
                                    anuluj
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </VersumShell>
        </RouteGuard>
    );
}
