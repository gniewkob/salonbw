'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import VersumCustomersVendorCss from '@/components/versum/VersumCustomersVendorCss';
import { useAuth } from '@/contexts/AuthContext';
import { useProductApi } from '@/api/products';
import { useProductCategories } from '@/hooks/useWarehouseViews';

export default function NewProductPage() {
    const { role } = useAuth();
    const router = useRouter();
    const productApi = useProductApi();
    const { data: categories = [] } = useProductCategories();
    const [isSaving, setIsSaving] = useState(false);
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

    if (!role) return null;

    const handleSubmit = async () => {
        if (!form.name.trim()) return;
        setIsSaving(true);
        try {
            await productApi.create({
                name: form.name.trim(),
                categoryId: form.categoryId
                    ? Number(form.categoryId)
                    : undefined,
                productType: form.productType,
                sku: form.sku.trim() || undefined,
                unit: form.unit.trim() || undefined,
                description: form.description.trim() || undefined,
                brand: form.brand.trim() || undefined,
                stock: Number(form.stock),
                unitPrice: Number(form.unitPrice),
                vatRate: Number(form.vatRate),
                minQuantity: Number(form.minQuantity),
            });
            await router.push('/products');
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
                        <li>Magazyn / Dodaj produkt</li>
                    </ul>

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
                                <label htmlFor="category">2. Kategoria</label>
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
                                <label htmlFor="description">11. Opis</label>
                                <textarea
                                    id="description"
                                    className="form-control"
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
                                {isSaving ? 'zapisywanie...' : 'dodaj produkt'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-default btn-xs"
                                onClick={() => void router.push('/products')}
                            >
                                wróć do listy
                            </button>
                        </div>
                    </form>
                </div>
            </VersumShell>
        </RouteGuard>
    );
}
