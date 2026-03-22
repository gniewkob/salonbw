'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import SalonBWVendorCss from '@/components/salonbw/SalonBWVendorCss';
import VersumBreadcrumbs from '@/components/salonbw/VersumBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useProductApi } from '@/api/products';
import { useProductCategories } from '@/hooks/useWarehouseViews';

export default function NewProductPage() {
    const { role } = useAuth();
    const router = useRouter();
    const productApi = useProductApi();
    const { data: categories = [] } = useProductCategories();
    const [isSaving, setIsSaving] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
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
    const handleFieldChange =
        (field: keyof typeof form) =>
        (
            event: React.ChangeEvent<
                HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
            >,
        ) => {
            const { value } = event.target;
            setForm((prev) => ({
                ...prev,
                [field]: value,
            }));
        };

    if (!role) return null;

    const handleSubmit = async () => {
        setApiError(null);
        if (!form.name.trim()) return;
        const stock = Number(form.stock);
        const unitPrice = Number(form.unitPrice);
        const vatRate = Number(form.vatRate);
        const minQuantity = Number(form.minQuantity);

        if (
            !Number.isFinite(stock) ||
            !Number.isFinite(unitPrice) ||
            !Number.isFinite(vatRate) ||
            !Number.isFinite(minQuantity)
        ) {
            setApiError('Wprowadź poprawne wartości liczbowe przed zapisem.');
            return;
        }
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
                stock,
                unitPrice,
                vatRate,
                minQuantity,
            });
            await router.push('/products');
        } catch (error) {
            console.error('Błąd zapisu produktu:', error);
            setApiError(
                error instanceof Error
                    ? error.message
                    : 'Wystąpił błąd podczas zapisywania produktu. Sprawdź poprawność danych i spróbuj ponownie.',
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <RouteGuard roles={['admin']} permission="nav:warehouse">
            <SalonBWShell role={role}>
                <SalonBWVendorCss />
                <div className="products_index" id="products_main">
                    <VersumBreadcrumbs
                        iconClass="sprite-breadcrumbs_stock"
                        items={[
                            { label: 'Magazyn', href: '/products' },
                            { label: 'Dodaj produkt' },
                        ]}
                    />

                    <form
                        className="product-form"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void handleSubmit();
                        }}
                    >
                        {apiError ? (
                            <div className="alert alert-danger">{apiError}</div>
                        ) : null}
                        <div className="product-form__section">
                            <h4>dane podstawowe</h4>

                            <div className="product-form__row">
                                <label htmlFor="name">1. Nazwa</label>
                                <input
                                    id="name"
                                    className="form-control"
                                    required
                                    value={form.name}
                                    onChange={handleFieldChange('name')}
                                />
                            </div>

                            <div className="product-form__row">
                                <label htmlFor="category">2. Kategoria</label>
                                <select
                                    id="category"
                                    className="salonbw-select"
                                    value={form.categoryId}
                                    onChange={handleFieldChange('categoryId')}
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
                                    className="salonbw-select"
                                    value={form.productType}
                                    onChange={handleFieldChange('productType')}
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
                                    onChange={handleFieldChange('sku')}
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
                                    min="0"
                                    value={form.stock}
                                    onChange={handleFieldChange('stock')}
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
                                    min="0"
                                    value={form.unitPrice}
                                    onChange={handleFieldChange('unitPrice')}
                                />
                            </div>

                            <div className="product-form__row">
                                <label htmlFor="vatRate">7. VAT (%)</label>
                                <input
                                    id="vatRate"
                                    type="number"
                                    className="form-control"
                                    min="0"
                                    value={form.vatRate}
                                    onChange={handleFieldChange('vatRate')}
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
                                    onChange={handleFieldChange('brand')}
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
                                    min="0"
                                    value={form.minQuantity}
                                    onChange={handleFieldChange('minQuantity')}
                                />
                            </div>

                            <div className="product-form__row">
                                <label htmlFor="unit">10. Jednostka</label>
                                <input
                                    id="unit"
                                    className="form-control"
                                    value={form.unit}
                                    onChange={handleFieldChange('unit')}
                                />
                            </div>

                            <div className="product-form__row">
                                <label htmlFor="description">11. Opis</label>
                                <textarea
                                    id="description"
                                    className="form-control"
                                    value={form.description}
                                    onChange={handleFieldChange('description')}
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
            </SalonBWShell>
        </RouteGuard>
    );
}
