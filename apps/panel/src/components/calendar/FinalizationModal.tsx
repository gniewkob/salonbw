'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import Modal from '@/components/Modal';
import { CALENDAR_QUERY_KEY } from '@/hooks/useCalendar';
import { APPOINTMENTS_QUERY_KEY } from '@/hooks/useAppointments';
import type {
    Appointment,
    PaymentMethod,
    FinalizeAppointmentRequest,
    ProductSaleItem,
    Product,
} from '@/types';

interface Props {
    appointment: Appointment | null;
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] =
    [
        { value: 'cash', label: 'Gotówka', icon: '💵' },
        { value: 'card', label: 'Karta', icon: '💳' },
        { value: 'transfer', label: 'Przelew', icon: '🏦' },
        { value: 'online', label: 'Online', icon: '📱' },
        { value: 'voucher', label: 'Voucher', icon: '🎁' },
    ];

export default function FinalizationModal({
    appointment,
    open,
    onClose,
    onSuccess,
}: Props) {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    // Form state
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
    const [discountPln, setDiscountPln] = useState<string>('');
    const [tipPln, setTipPln] = useState<string>('');
    const [note, setNote] = useState<string>('');
    const [productSales, setProductSales] = useState<ProductSaleItem[]>([]);
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [uiError, setUiError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );

    // Fetch products for upselling
    const { data: productsResponse } = useQuery<ProductsResponse>({
        queryKey: ['products'],
        queryFn: () => apiFetch<ProductsResponse>('/products'),
        enabled: open && showProductPicker,
    });
    const products = useMemo<Product[]>(
        () =>
            Array.isArray(productsResponse)
                ? productsResponse
                : (productsResponse?.items ?? []),
        [productsResponse],
    );

    // Calculate totals
    const summary = useMemo(() => {
        const servicePrice = appointment?.service?.price ?? 0;
        const discount = parseFloat(discountPln) || 0;
        const tip = parseFloat(tipPln) || 0;
        const productsTotal = productSales.reduce((sum, item) => {
            const product = products.find((p) => p.id === item.productId);
            const price = item.unitPriceCents
                ? item.unitPriceCents / 100
                : (product?.unitPrice ?? 0);
            const itemDiscount = item.discountCents
                ? item.discountCents / 100
                : 0;
            return sum + (price * item.quantity - itemDiscount);
        }, 0);
        const grandTotal = servicePrice - discount + tip + productsTotal;

        return {
            servicePrice,
            discount,
            tip,
            productsTotal,
            grandTotal: Math.max(0, grandTotal),
        };
    }, [appointment, discountPln, tipPln, productSales, products]);
    const maxDiscount = summary.servicePrice + summary.productsTotal;
    const isDiscountInvalid = summary.discount > maxDiscount;

    // Finalize mutation
    const finalizeMutation = useMutation({
        mutationFn: async (data: FinalizeAppointmentRequest) => {
            return apiFetch<Appointment>(
                `/appointments/${appointment?.id}/finalize`,
                {
                    method: 'POST',
                    body: JSON.stringify(data),
                },
            );
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: CALENDAR_QUERY_KEY,
            });
            void queryClient.invalidateQueries({
                queryKey: APPOINTMENTS_QUERY_KEY,
            });
            setSuccessMessage('Wizyta została poprawnie sfinalizowana.');
            onSuccess?.();
            closeTimerRef.current = setTimeout(() => {
                handleClose();
            }, 900);
        },
        onError: (error) => {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Wystąpił błąd podczas finalizacji wizyty';
            if (message.toLowerCase().includes('pos is disabled')) {
                setUiError(
                    'Sprzedaż produktów jest wyłączona (POS). Włącz POS_ENABLED=true.',
                );
                return;
            }
            setUiError(message);
        },
    });

    const handleClose = () => {
        if (closeTimerRef.current !== null) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
        setPaymentMethod('card');
        setDiscountPln('');
        setTipPln('');
        setNote('');
        setProductSales([]);
        setShowProductPicker(false);
        setUiError(null);
        setSuccessMessage(null);
        onClose();
    };

    useEffect(
        () => () => {
            if (closeTimerRef.current !== null) {
                clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
            }
        },
        [],
    );

    const handleSubmit = () => {
        if (!appointment) return;
        if (isDiscountInvalid) {
            setUiError(
                'Rabat nie może być większy niż suma usługi i produktów.',
            );
            return;
        }
        setUiError(null);

        const data: FinalizeAppointmentRequest = {
            paymentMethod,
            paidAmountCents: Math.round(summary.grandTotal * 100),
            tipAmountCents: Math.round(summary.tip * 100),
            discountCents: Math.round(summary.discount * 100),
            products: productSales.length > 0 ? productSales : undefined,
            note: note || undefined,
        };

        finalizeMutation.mutate(data);
    };

    const addProduct = (productId: number) => {
        const product = products.find((p) => p.id === productId);
        const trackStock = product?.trackStock !== false;
        const availableStock = product?.stock ?? 0;
        const existing = productSales.find((p) => p.productId === productId);
        if (trackStock && existing && existing.quantity >= availableStock) {
            setUiError(
                `Maksymalna ilość dla ${product?.name ?? 'produktu'} to ${availableStock}.`,
            );
            return;
        }
        if (trackStock && !existing && availableStock <= 0) {
            setUiError(
                `Produkt ${product?.name ?? 'jest niedostępny'} (stan: 0).`,
            );
            return;
        }
        setUiError(null);
        if (existing) {
            setProductSales(
                productSales.map((p) =>
                    p.productId === productId
                        ? { ...p, quantity: p.quantity + 1 }
                        : p,
                ),
            );
        } else {
            setProductSales([...productSales, { productId, quantity: 1 }]);
        }
    };

    const removeProduct = (productId: number) => {
        setProductSales(productSales.filter((p) => p.productId !== productId));
    };

    const updateProductQuantity = (productId: number, quantity: number) => {
        if (quantity <= 0) {
            removeProduct(productId);
        } else {
            const product = products.find((p) => p.id === productId);
            const trackStock = product?.trackStock !== false;
            const availableStock = product?.stock ?? 0;
            if (trackStock && quantity > availableStock) {
                setUiError(
                    `Maksymalna ilość dla ${product?.name ?? 'produktu'} to ${availableStock}.`,
                );
                return;
            }
            setUiError(null);
            setProductSales(
                productSales.map((p) =>
                    p.productId === productId ? { ...p, quantity } : p,
                ),
            );
        }
    };

    if (!appointment) return null;

    return (
        <Modal open={open} onClose={handleClose}>
            <div
                className="w-100"
                style={{
                    width: 'min(860px, 92vw)',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                }}
            >
                <h2 className="fs-5 fw-semibold mb-3">Finalizacja wizyty</h2>

                {/* Client & Service Info */}
                <div className="bg-light rounded-3 p-2 mb-3">
                    <div className="small text-muted">
                        <span className="fw-medium">
                            {appointment.client?.name}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{appointment.service?.name}</span>
                    </div>
                    <div className="fs-5 fw-semibold mt-1">
                        {summary.servicePrice.toFixed(2)} PLN
                    </div>
                </div>

                {/* Payment Method */}
                <div className="mb-3">
                    <label className="d-block small fw-medium text-body mb-2">
                        Metoda płatności
                    </label>
                    <div
                        className="d-grid gap-2 mb-2"
                        style={{
                            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                        }}
                    >
                        {PAYMENT_METHODS.map((method) => (
                            <button
                                key={method.value}
                                type="button"
                                onClick={() => setPaymentMethod(method.value)}
                                className={`d-flex flex-column align-items-center p-2 rounded-3 border border-2 ${
                                    paymentMethod === method.value
                                        ? 'border-primary bg-primary bg-opacity-10'
                                        : 'border-secondary border-opacity-25 border-opacity-50'
                                }`}
                            >
                                <span className="fs-5">{method.icon}</span>
                                <span className="small mt-1">
                                    {method.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Discount & Tip */}
                <div
                    className="d-grid gap-3 mb-3"
                    style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
                >
                    <div>
                        <label className="d-block small fw-medium text-body mb-1">
                            Rabat (PLN)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={discountPln}
                            onChange={(e) => setDiscountPln(e.target.value)}
                            className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-2"
                            placeholder="0.00"
                        />
                        {isDiscountInvalid && (
                            <div className="small text-danger mt-1">
                                Maksymalny rabat dla tej finalizacji to{' '}
                                {maxDiscount.toFixed(2)} PLN.
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="d-block small fw-medium text-body mb-1">
                            Napiwek (PLN)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={tipPln}
                            onChange={(e) => setTipPln(e.target.value)}
                            className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-2"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Product Upselling */}
                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="d-block small fw-medium text-body">
                            Sprzedaż produktów
                        </label>
                        <button
                            type="button"
                            onClick={() =>
                                setShowProductPicker(!showProductPicker)
                            }
                            className="small text-primary"
                        >
                            {showProductPicker ? 'Ukryj' : '+ Dodaj produkt'}
                        </button>
                    </div>

                    {showProductPicker && (
                        <div
                            className="border border-secondary border-opacity-25 rounded-3 p-2 mb-2 overflow-y-auto"
                            style={{ maxHeight: '220px' }}
                        >
                            {products.length === 0 ? (
                                <p className="small text-muted text-center py-2">
                                    Brak produktów
                                </p>
                            ) : (
                                <div className="d-flex flex-column gap-1">
                                    {products.map((product) => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() =>
                                                addProduct(product.id)
                                            }
                                            className="w-100 text-start px-2 py-1 small rounded d-flex justify-content-between"
                                        >
                                            <span>
                                                {product.name}
                                                <span className="text-muted ms-2">
                                                    stan: {product.stock}
                                                </span>
                                            </span>
                                            <span className="text-muted">
                                                {product.unitPrice.toFixed(2)}{' '}
                                                PLN
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {productSales.length > 0 && (
                        <div className="d-flex flex-column gap-2">
                            {productSales.map((sale) => {
                                const product = products.find(
                                    (p) => p.id === sale.productId,
                                );
                                const unitPrice =
                                    sale.unitPriceCents !== undefined
                                        ? sale.unitPriceCents / 100
                                        : (product?.unitPrice ?? 0);
                                const lineTotal = unitPrice * sale.quantity;
                                return (
                                    <div
                                        key={sale.productId}
                                        className="d-flex align-items-center justify-content-between bg-light rounded px-2 py-1"
                                    >
                                        <div className="small">
                                            <div>{product?.name}</div>
                                            <div className="text-muted">
                                                {unitPrice.toFixed(2)} PLN x{' '}
                                                {sale.quantity} ={' '}
                                                {lineTotal.toFixed(2)} PLN
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateProductQuantity(
                                                        sale.productId,
                                                        sale.quantity - 1,
                                                    )
                                                }
                                                className="d-flex align-items-center justify-content-center rounded border"
                                                style={{
                                                    width: '24px',
                                                    height: '24px',
                                                }}
                                            >
                                                -
                                            </button>
                                            <span
                                                className="text-center small"
                                                style={{ width: '24px' }}
                                            >
                                                {sale.quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateProductQuantity(
                                                        sale.productId,
                                                        sale.quantity + 1,
                                                    )
                                                }
                                                className="d-flex align-items-center justify-content-center rounded border"
                                                style={{
                                                    width: '24px',
                                                    height: '24px',
                                                }}
                                            >
                                                +
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeProduct(
                                                        sale.productId,
                                                    )
                                                }
                                                className="text-danger ms-1"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Note */}
                <div className="mb-3">
                    <label className="d-block small fw-medium text-body mb-1">
                        Notatka (opcjonalnie)
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-2"
                        rows={2}
                        placeholder="Dodatkowe uwagi..."
                    />
                </div>

                {/* Summary */}
                <div className="bg-light rounded-3 p-2 mb-3">
                    <div className="d-flex flex-column gap-1 small">
                        <div className="d-flex justify-content-between">
                            <span>Usługa:</span>
                            <span>{summary.servicePrice.toFixed(2)} PLN</span>
                        </div>
                        {summary.productsTotal > 0 && (
                            <div className="d-flex justify-content-between">
                                <span>Produkty:</span>
                                <span>
                                    {summary.productsTotal.toFixed(2)} PLN
                                </span>
                            </div>
                        )}
                        {summary.discount > 0 && (
                            <div className="d-flex justify-content-between text-success">
                                <span>Rabat:</span>
                                <span>-{summary.discount.toFixed(2)} PLN</span>
                            </div>
                        )}
                        {summary.tip > 0 && (
                            <div className="d-flex justify-content-between text-primary">
                                <span>Napiwek:</span>
                                <span>+{summary.tip.toFixed(2)} PLN</span>
                            </div>
                        )}
                        <div className="border-top pt-1 mt-1">
                            <div className="d-flex justify-content-between fw-semibold fs-5">
                                <span>Do zapłaty:</span>
                                <span>{summary.grandTotal.toFixed(2)} PLN</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {(finalizeMutation.isError || uiError) && (
                    <div className="bg-danger bg-opacity-10 text-danger p-2 rounded mb-3 small">
                        {uiError ?? 'Wystąpił błąd podczas finalizacji wizyty'}
                    </div>
                )}
                {successMessage && (
                    <div className="bg-success bg-opacity-10 text-success p-2 rounded mb-3 small">
                        {successMessage}
                    </div>
                )}

                {/* Actions */}
                <div className="d-flex gap-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex-fill px-3 py-2 border border-secondary border-opacity-50 rounded-2"
                    >
                        Anuluj
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={
                            finalizeMutation.isPending || isDiscountInvalid
                        }
                        className="flex-fill btn btn-success"
                    >
                        {finalizeMutation.isPending
                            ? 'Zapisywanie...'
                            : 'Zakończ wizytę'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
type ProductsResponse =
    | Product[]
    | {
          items?: Product[];
      };
