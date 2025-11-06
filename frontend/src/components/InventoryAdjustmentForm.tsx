import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Product } from '@/types';
import { AdjustInventoryData } from '@/hooks/useRetail';

const reasons = ['delivery', 'sale', 'correction', 'damage', 'return', 'transfer'] as const;

interface Props {
    products: Product[];
    onSubmit: (data: AdjustInventoryData) => Promise<void>;
    onCancel: () => void;
}

export default function InventoryAdjustmentForm({ products, onSubmit, onCancel }: Props) {
    const firstProductId = useMemo(
        () => (products.length > 0 ? String(products[0].id) : ''),
        [products],
    );
    const [productId, setProductId] = useState(firstProductId);
    const [delta, setDelta] = useState('');
    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!productId && firstProductId) {
            setProductId(firstProductId);
        }
    }, [firstProductId, productId]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        const parsedData = {
            productId: productId ? Number(productId) : NaN,
            delta: delta !== '' ? Number(delta) : NaN,
            reason: reason || undefined,
            note: note.trim() !== '' ? note.trim() : undefined,
        };

        if (!Number.isFinite(parsedData.productId) || parsedData.productId < 1) {
            setError('Product is required');
            return;
        }

        if (!Number.isFinite(parsedData.delta)) {
            setError('Delta is required');
            return;
        }

        if (!parsedData.reason || !reasons.includes(parsedData.reason as typeof reasons[number])) {
            setError('Reason is required');
            return;
        }

        if (parsedData.note && parsedData.note.length > 500) {
            setError('Note must be <= 500 characters');
            return;
        }

        setError('');
        setSubmitting(true);
        try {
            await onSubmit({
                productId: parsedData.productId,
                delta: parsedData.delta,
                reason: parsedData.reason as AdjustInventoryData['reason'],
                note: parsedData.note,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message || 'Error' : 'Error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
            <select
                data-testid="product-select"
                className="border p-1 w-full"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
            >
                {products.map((product) => (
                    <option
                        key={product.id}
                        value={product.id}
                        data-testid={`product-option-${product.id}`}
                    >
                        {product.name}
                    </option>
                ))}
            </select>
            <input
                type="number"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                className="border p-1 w-full"
                placeholder="Delta"
            />
            <p className="text-sm text-gray-500">
                Positive for stock in, negative for stock out
            </p>
            <select
                data-testid="reason-select"
                className="border p-1 w-full"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
            >
                <option value="">Select reason</option>
                {reasons.map((option) => (
                    <option
                        key={option}
                        value={option}
                        data-testid={`reason-option-${option}`}
                    >
                        {option}
                    </option>
                ))}
            </select>
            <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="border p-1 w-full"
                placeholder="Note (optional)"
                maxLength={500}
                rows={3}
            />
            {error && (
                <p role="alert" className="text-red-600 text-sm">
                    {error}
                </p>
            )}
            <div className="flex gap-2 justify-end">
                <button
                    type="button"
                    onClick={onCancel}
                    className="border px-2 py-1"
                    disabled={submitting}
                >
                    Cancel
                </button>
                <button type="submit" className="border px-2 py-1" disabled={submitting}>
                    {submitting ? 'Saving…' : 'Save'}
                </button>
            </div>
        </form>
    );
}
