import { useState } from 'react';
import Modal from '@/components/Modal';
import { useProductApi } from '@/api/products';
import { useProductCategories } from '@/hooks/useWarehouseViews';

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function NewProductModal({ open, onClose, onSuccess }: Props) {
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

    const field =
        (key: keyof typeof form) =>
        (
            e: React.ChangeEvent<
                HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
            >,
        ) =>
            setForm((p) => ({ ...p, [key]: e.target.value }));

    const reset = () => {
        setForm({
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
        setApiError(null);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
            setApiError('Wprowadź poprawne wartości liczbowe.');
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
            reset();
            onSuccess();
        } catch (err) {
            setApiError(
                err instanceof Error
                    ? err.message
                    : 'Wystąpił błąd podczas zapisywania produktu.',
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal open={open} onClose={handleClose} size="lg">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-semibold">Nowy produkt</h5>
                <button
                    type="button"
                    className="btn-close"
                    aria-label="Zamknij"
                    onClick={handleClose}
                />
            </div>

            {apiError ? (
                <div className="alert alert-danger py-2 small">{apiError}</div>
            ) : null}

            <form
                className="product-form"
                onSubmit={(e) => void handleSubmit(e)}
            >
                <div className="product-form__section">
                    <h4>dane podstawowe</h4>

                    <div className="product-form__row">
                        <label htmlFor="modal-name">1. Nazwa</label>
                        <input
                            id="modal-name"
                            className="form-control"
                            required
                            autoFocus
                            value={form.name}
                            onChange={field('name')}
                        />
                    </div>

                    <div className="product-form__row">
                        <label htmlFor="modal-category">2. Kategoria</label>
                        <select
                            id="modal-category"
                            className="form-select"
                            value={form.categoryId}
                            onChange={field('categoryId')}
                        >
                            <option value="">brak kategorii</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="product-form__row">
                        <label htmlFor="modal-productType">
                            3. Rodzaj produktu
                        </label>
                        <select
                            id="modal-productType"
                            className="form-select"
                            value={form.productType}
                            onChange={field('productType')}
                        >
                            <option value="product">towar</option>
                            <option value="supply">materiał</option>
                            <option value="universal">uniwersalny</option>
                        </select>
                    </div>

                    <div className="product-form__row">
                        <label htmlFor="modal-sku">
                            4. Kod wewnętrzny (SKU)
                        </label>
                        <input
                            id="modal-sku"
                            className="form-control"
                            value={form.sku}
                            onChange={field('sku')}
                        />
                    </div>

                    <div className="row g-2">
                        <div className="col-4">
                            <div className="product-form__row">
                                <label htmlFor="modal-stock">
                                    5. Stan magazynowy
                                </label>
                                <input
                                    id="modal-stock"
                                    type="number"
                                    className="form-control"
                                    min="0"
                                    value={form.stock}
                                    onChange={field('stock')}
                                />
                            </div>
                        </div>
                        <div className="col-4">
                            <div className="product-form__row">
                                <label htmlFor="modal-unitPrice">
                                    6. Cena brutto
                                </label>
                                <input
                                    id="modal-unitPrice"
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    min="0"
                                    value={form.unitPrice}
                                    onChange={field('unitPrice')}
                                />
                            </div>
                        </div>
                        <div className="col-4">
                            <div className="product-form__row">
                                <label htmlFor="modal-vatRate">
                                    7. VAT (%)
                                </label>
                                <input
                                    id="modal-vatRate"
                                    type="number"
                                    className="form-control"
                                    min="0"
                                    value={form.vatRate}
                                    onChange={field('vatRate')}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="product-form__section">
                    <h4>dane rozszerzone</h4>

                    <div className="row g-2">
                        <div className="col-6">
                            <div className="product-form__row">
                                <label htmlFor="modal-brand">
                                    8. Producent
                                </label>
                                <input
                                    id="modal-brand"
                                    className="form-control"
                                    value={form.brand}
                                    onChange={field('brand')}
                                />
                            </div>
                        </div>
                        <div className="col-3">
                            <div className="product-form__row">
                                <label htmlFor="modal-minQuantity">
                                    9. Min. stan
                                </label>
                                <input
                                    id="modal-minQuantity"
                                    type="number"
                                    className="form-control"
                                    min="0"
                                    value={form.minQuantity}
                                    onChange={field('minQuantity')}
                                />
                            </div>
                        </div>
                        <div className="col-3">
                            <div className="product-form__row">
                                <label htmlFor="modal-unit">
                                    10. Jednostka
                                </label>
                                <input
                                    id="modal-unit"
                                    className="form-control"
                                    value={form.unit}
                                    onChange={field('unit')}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="product-form__row">
                        <label htmlFor="modal-description">11. Opis</label>
                        <textarea
                            id="modal-description"
                            className="form-control"
                            rows={2}
                            value={form.description}
                            onChange={field('description')}
                        />
                    </div>
                </div>

                <div className="d-flex gap-2 justify-content-end pt-2">
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={handleClose}
                        disabled={isSaving}
                    >
                        anuluj
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={isSaving || !form.name.trim()}
                    >
                        {isSaving ? 'zapisywanie...' : 'dodaj produkt'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
