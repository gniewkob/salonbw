import { FormEvent, useState } from 'react';

interface Props {
    onSubmit: (amount: number) => Promise<void>;
    onCancel: () => void;
}

export default function StockForm({ onSubmit, onCancel }: Props) {
    const [amount, setAmount] = useState(0);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const num = Number(amount);
        if (Number.isNaN(num) || !Number.isFinite(num)) {
            setError('Podaj ilość');
            return;
        }
        try {
            setSubmitting(true);
            await onSubmit(num);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Wystąpił błąd');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="gap-2">
            <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="border p-1 w-100"
                placeholder="Ilość"
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
