'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import Modal from '@/components/Modal';
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

    // Fetch products for upselling
    const { data: products = [] } = useQuery<Product[]>({
        queryKey: ['products'],
        queryFn: () => apiFetch<Product[]>('/products'),
        enabled: open && showProductPicker,
    });

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
            void queryClient.invalidateQueries({ queryKey: ['calendar'] });
            void queryClient.invalidateQueries({ queryKey: ['appointments'] });
            onSuccess?.();
            handleClose();
        },
    });

    const handleClose = () => {
        setPaymentMethod('card');
        setDiscountPln('');
        setTipPln('');
        setNote('');
        setProductSales([]);
        setShowProductPicker(false);
        onClose();
    };

    const handleSubmit = () => {
        if (!appointment) return;

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
        const existing = productSales.find((p) => p.productId === productId);
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
            <div className="w-full max-w-lg">
                <h2 className="text-xl font-semibold mb-4">
                    Finalizacja wizyty
                </h2>

                {/* Client & Service Info */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">
                            {appointment.client?.name}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{appointment.service?.name}</span>
                    </div>
                    <div className="text-lg font-semibold mt-1">
                        {summary.servicePrice.toFixed(2)} PLN
                    </div>
                </div>

                {/* Payment Method */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Metoda płatności
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                        {PAYMENT_METHODS.map((method) => (
                            <button
                                key={method.value}
                                type="button"
                                onClick={() => setPaymentMethod(method.value)}
                                className={`flex flex-col items-center p-2 rounded-lg border-2 transition-colors ${
                                    paymentMethod === method.value
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <span className="text-xl">{method.icon}</span>
                                <span className="text-xs mt-1">
                                    {method.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Discount & Tip */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rabat (PLN)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={discountPln}
                            onChange={(e) => setDiscountPln(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Napiwek (PLN)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={tipPln}
                            onChange={(e) => setTipPln(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Product Upselling */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Sprzedaż produktów
                        </label>
                        <button
                            type="button"
                            onClick={() =>
                                setShowProductPicker(!showProductPicker)
                            }
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            {showProductPicker ? 'Ukryj' : '+ Dodaj produkt'}
                        </button>
                    </div>

                    {showProductPicker && (
                        <div className="border border-gray-200 rounded-lg p-2 mb-2 max-h-32 overflow-y-auto">
                            {products.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-2">
                                    Brak produktów
                                </p>
                            ) : (
                                <div className="space-y-1">
                                    {products.map((product) => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() =>
                                                addProduct(product.id)
                                            }
                                            className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded flex justify-between"
                                        >
                                            <span>{product.name}</span>
                                            <span className="text-gray-500">
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
                        <div className="space-y-2">
                            {productSales.map((sale) => {
                                const product = products.find(
                                    (p) => p.id === sale.productId,
                                );
                                return (
                                    <div
                                        key={sale.productId}
                                        className="flex items-center justify-between bg-gray-50 rounded px-2 py-1"
                                    >
                                        <span className="text-sm">
                                            {product?.name}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateProductQuantity(
                                                        sale.productId,
                                                        sale.quantity - 1,
                                                    )
                                                }
                                                className="w-6 h-6 flex items-center justify-center rounded border hover:bg-gray-200"
                                            >
                                                -
                                            </button>
                                            <span className="w-6 text-center text-sm">
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
                                                className="w-6 h-6 flex items-center justify-center rounded border hover:bg-gray-200"
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
                                                className="text-red-500 hover:text-red-700 ml-1"
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
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notatka (opcjonalnie)
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Dodatkowe uwagi..."
                    />
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span>Usługa:</span>
                            <span>{summary.servicePrice.toFixed(2)} PLN</span>
                        </div>
                        {summary.productsTotal > 0 && (
                            <div className="flex justify-between">
                                <span>Produkty:</span>
                                <span>
                                    {summary.productsTotal.toFixed(2)} PLN
                                </span>
                            </div>
                        )}
                        {summary.discount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Rabat:</span>
                                <span>-{summary.discount.toFixed(2)} PLN</span>
                            </div>
                        )}
                        {summary.tip > 0 && (
                            <div className="flex justify-between text-blue-600">
                                <span>Napiwek:</span>
                                <span>+{summary.tip.toFixed(2)} PLN</span>
                            </div>
                        )}
                        <div className="border-t pt-1 mt-1">
                            <div className="flex justify-between font-semibold text-lg">
                                <span>Do zapłaty:</span>
                                <span>{summary.grandTotal.toFixed(2)} PLN</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {finalizeMutation.isError && (
                    <div className="bg-red-50 text-red-600 p-2 rounded mb-4 text-sm">
                        Wystąpił błąd podczas finalizacji wizyty
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Anuluj
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={finalizeMutation.isPending}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
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
