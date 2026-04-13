import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Product } from '@/types';
import { AdjustInventoryData } from '@/hooks/useRetail';

const reasons = [
    'delivery',
    'sale',
    'correction',
    'damage',
    'return',
    'transfer',
] as const;

const reasonLabels: Record<(typeof reasons)[number], string> = {
    delivery: 'Dostawa',
    sale: 'Sprzedaż',
    correction: 'Korekta',
    damage: 'Uszkodzenie',
    return: 'Zwrot',
    transfer: 'Przesunięcie',
};

interface Props {
    products: Product[];
    onSubmit: (data: AdjustInventoryData) => Promise<void>;
    onCancel: () => void;
}

export default function InventoryAdjustmentForm({
    products,
    onSubmit,
    onCancel,
}: Props) {
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

        if (
            !Number.isFinite(parsedData.productId) ||
            parsedData.productId < 1
        ) {
            setError('Wybierz produkt');
            return;
        }

        if (!Number.isFinite(parsedData.delta)) {
            setError('Podaj zmianę stanu');
            return;
        }

        if (
            !parsedData.reason ||
            !reasons.includes(parsedData.reason as (typeof reasons)[number])
        ) {
            setError('Wybierz powód zmiany');
            return;
        }

        if (parsedData.note && parsedData.note.length > 500) {
            setError('Notatka może mieć maksymalnie 500 znaków');
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
            setError(
                err instanceof Error
                    ? err.message || 'Wystąpił błąd'
                    : 'Wystąpił błąd',
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleReasonSelectClick = (
        event: React.MouseEvent<HTMLSelectElement>,
    ) => {
        const option = event.target as HTMLOptionElement | null;
        if (option && typeof option.value === 'string') {
            setReason(option.value);
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="gap-2">
            <select
                data-testid="product-select"
                className="border p-1 w-100"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                onClick={(e) => {
                    const option = e.target as HTMLOptionElement | null;
                    if (option && typeof option.value === 'string') {
                        setProductId(option.value);
                    }
                }}
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
                className="border p-1 w-100"
                placeholder="Zmiana stanu"
            />
            <p className="small text-muted">
                Wartość dodatnia zwiększa stan, a ujemna zmniejsza stan
            </p>
            <select
                data-testid="reason-select"
                className="border p-1 w-100"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                onClick={handleReasonSelectClick}
            >
                <option value="">Wybierz powód</option>
                {reasons.map((option) => (
                    <option
                        key={option}
                        value={option}
                        data-testid={`reason-option-${option}`}
                    >
                        {reasonLabels[option]}
                    </option>
                ))}
            </select>
            <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="border p-1 w-100"
                placeholder="Notatka (opcjonalnie)"
                maxLength={500}
                rows={3}
            />
            {error && (
                <p role="alert" className="text-danger small">
                    {error}
                </p>
            )}
            <div className="d-flex gap-2 justify-content-end">
                <button
                    type="button"
                    onClick={onCancel}
                    className="border px-2 py-1"
                    disabled={submitting}
                >
                    Anuluj
                </button>
                <button
                    type="submit"
                    className="border px-2 py-1"
                    disabled={submitting}
                >
                    {submitting ? 'Zapisywanie…' : 'Zapisz'}
                </button>
            </div>
        </form>
    );
}
