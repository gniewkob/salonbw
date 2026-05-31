import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/Modal';
import { useProductApi } from '@/api/products';
import { useProductCategories } from '@/hooks/useWarehouseViews';
import { useAuth } from '@/contexts/AuthContext';
import type { ProductExtended } from '@/types';

interface Props {
    open: boolean;
    productId: number | null;
    onClose: () => void;
    onSuccess: () => void;
    onDeleted: () => void;
}

export default function EditProductModal({
    open,
    productId,
    onClose,
    onSuccess,
    onDeleted,
}: Props) {
    const { apiFetch } = useAuth();
    const productApi = useProductApi();
    const queryClient = useQueryClient();
    const { data: categories = [] } = useProductCategories();
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
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

    const { data: product, isLoading } = useQuery<ProductExtended>({
        queryKey: ['product-edit', productId],
        queryFn: () => apiFetch<ProductExtended>(`/products/${productId}`),
        enabled: open && productId !== null,
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
        setApiError(null);
        setConfirmDelete(false);
    }, [product]);

    const field =
        (key: keyof typeof form) =>
        (
            e: React.ChangeEvent<
                HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
            >,
        ) =>
            setForm((p) => ({ ...p, [key]: e.target.value }));

    const handleClose = () => {
        setConfirmDelete(false);
        setApiError(null);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productId || !form.name.trim()) return;
        setApiError(null);
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
            void queryClient.invalidateQueries({
                queryKey: ['warehouse-products'],
            });
            void queryClient.invalidateQueries({
                queryKey: ['product-edit', productId],
            });
            onSuccess();
        } catch (err) {
            setApiError(
                err instanceof Error
                    ? err.message
                    : 'Wystąpił błąd podczas zapisywania.',
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!productId) return;
        setIsDeleting(true);
        try {
            await productApi.remove(productId);
            void queryClient.invalidateQueries({
                queryKey: ['warehouse-products'],
            });
            onDeleted();
        } catch (err) {
            setApiError(
                err instanceof Error ? err.message : 'Nie udało się usunąć.',
            );
            setConfirmDelete(false);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Modal open={open} onClose={handleClose} size="lg">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-semibold">Edytuj produkt</h5>
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

            {isLoading ? (
                <p className="text-muted small">Ładowanie produktu...</p>
            ) : (
                <form
                    className="product-form"
                    onSubmit={(e) => void handleSubmit(e)}
                >
                    <div className="product-form__section">
                        <h4>dane podstawowe</h4>

                        <div className="product-form__row">
                            <label htmlFor="edit-modal-name">1. Nazwa</label>
                            <input
                                id="edit-modal-name"
                                className="form-control"
                                required
                                autoFocus
                                value={form.name}
                                onChange={field('name')}
                            />
                        </div>

                        <div className="product-form__row">
                            <label htmlFor="edit-modal-category">
                                2. Kategoria
                            </label>
                            <select
                                id="edit-modal-category"
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
                            <label htmlFor="edit-modal-productType">
                                3. Rodzaj produktu
                            </label>
                            <select
                                id="edit-modal-productType"
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
                            <label htmlFor="edit-modal-sku">
                                4. Kod wewnętrzny (SKU)
                            </label>
                            <input
                                id="edit-modal-sku"
                                className="form-control"
                                value={form.sku}
                                onChange={field('sku')}
                            />
                        </div>

                        <div className="row g-2">
                            <div className="col-4">
                                <div className="product-form__row">
                                    <label htmlFor="edit-modal-stock">
                                        5. Stan magazynowy
                                    </label>
                                    <input
                                        id="edit-modal-stock"
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
                                    <label htmlFor="edit-modal-unitPrice">
                                        6. Cena brutto
                                    </label>
                                    <input
                                        id="edit-modal-unitPrice"
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
                                    <label htmlFor="edit-modal-vatRate">
                                        7. VAT (%)
                                    </label>
                                    <input
                                        id="edit-modal-vatRate"
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
                                    <label htmlFor="edit-modal-brand">
                                        8. Producent
                                    </label>
                                    <input
                                        id="edit-modal-brand"
                                        className="form-control"
                                        value={form.brand}
                                        onChange={field('brand')}
                                    />
                                </div>
                            </div>
                            <div className="col-3">
                                <div className="product-form__row">
                                    <label htmlFor="edit-modal-minQuantity">
                                        9. Min. stan
                                    </label>
                                    <input
                                        id="edit-modal-minQuantity"
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
                                    <label htmlFor="edit-modal-unit">
                                        10. Jednostka
                                    </label>
                                    <input
                                        id="edit-modal-unit"
                                        className="form-control"
                                        value={form.unit}
                                        onChange={field('unit')}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="product-form__row">
                            <label htmlFor="edit-modal-description">
                                11. Opis
                            </label>
                            <textarea
                                id="edit-modal-description"
                                className="form-control"
                                rows={2}
                                value={form.description}
                                onChange={field('description')}
                            />
                        </div>
                    </div>

                    <div className="d-flex gap-2 justify-content-between pt-2">
                        <div>
                            {confirmDelete ? (
                                <div className="d-flex gap-2 align-items-center">
                                    <span className="small text-danger">
                                        Usunąć produkt?
                                    </span>
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm"
                                        onClick={() => void handleDelete()}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting
                                            ? 'usuwanie...'
                                            : 'tak, usuń'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => setConfirmDelete(false)}
                                        disabled={isDeleting}
                                    >
                                        anuluj
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => setConfirmDelete(true)}
                                    disabled={isSaving}
                                >
                                    usuń produkt
                                </button>
                            )}
                        </div>
                        <div className="d-flex gap-2">
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
                                {isSaving ? 'zapisywanie...' : 'zapisz zmiany'}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </Modal>
    );
}
