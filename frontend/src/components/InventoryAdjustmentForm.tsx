import { FormEvent, useEffect, useMemo, useState } from 'react';
import * as Select from '@radix-ui/react-select';
import { z } from 'zod';
import { Product } from '@/types';
import { AdjustInventoryData } from '@/hooks/useRetail';

const reasons = ['delivery', 'sale', 'correction', 'damage', 'return', 'transfer'] as const;

const schema = z.object({
    productId: z
        .number({
            message: 'Product is required',
        })
        .min(1, { message: 'Product is required' }),
    delta: z.number({
        message: 'Delta is required',
    }),
    reason: z.enum(reasons, {
        message: 'Reason is required',
    }),
    note: z.string().max(500, { message: 'Note must be <= 500 characters' }).optional(),
});

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
            productId: productId ? Number(productId) : undefined,
            delta: delta !== '' ? Number(delta) : undefined,
            reason: reason || undefined,
            note: note.trim() !== '' ? note.trim() : undefined,
        };

        try {
            const data = schema.parse(parsedData);

            setSubmitting(true);
            await onSubmit({
                productId: data.productId,
                delta: data.delta,
                reason: data.reason,
                note: data.note,
            });
        } catch (err: unknown) {
            if (err instanceof z.ZodError) {
                setError(err.issues[0]?.message ?? 'Error');
            } else if (err instanceof Error) {
                setError(err.message || 'Error');
            } else {
                setError('Error');
            }
            return;
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
            <Select.Root value={productId} onValueChange={(value) => setProductId(value)}>
                <Select.Trigger
                    data-testid="product-select"
                    className="border p-1 w-full text-left"
                >
                    <Select.Value placeholder="Select product" />
                </Select.Trigger>
                <Select.Portal>
                    <Select.Content className="border bg-white">
                        <Select.Viewport>
                            {products.map((product) => (
                                <Select.Item
                                    key={product.id}
                                    value={String(product.id)}
                                    data-testid={`product-option-${product.id}`}
                                    className="p-1"
                                >
                                    <Select.ItemText>{product.name}</Select.ItemText>
                                </Select.Item>
                            ))}
                        </Select.Viewport>
                    </Select.Content>
                </Select.Portal>
            </Select.Root>
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
            <Select.Root value={reason} onValueChange={(value) => setReason(value)}>
                <Select.Trigger
                    data-testid="reason-select"
                    className="border p-1 w-full text-left"
                >
                    <Select.Value placeholder="Select reason" />
                </Select.Trigger>
                <Select.Portal>
                    <Select.Content className="border bg-white">
                        <Select.Viewport>
                            {reasons.map((option) => (
                                <Select.Item
                                    key={option}
                                    value={option}
                                    data-testid={`reason-option-${option}`}
                                    className="p-1"
                                >
                                    <Select.ItemText>{option}</Select.ItemText>
                                </Select.Item>
                            ))}
                        </Select.Viewport>
                    </Select.Content>
                </Select.Portal>
            </Select.Root>
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
