import { FormEvent, useState } from 'react';

interface Props {
    onSubmit: (amount: number) => Promise<void>;
    onCancel: () => void;
}

export default function StockForm({ onSubmit, onCancel }: Props) {
    const [amount, setAmount] = useState(0);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const num = Number(amount);
        if (Number.isNaN(num) || !Number.isFinite(num)) {
            setError('Amount is required');
            return;
        }
        try {
            await onSubmit(num);
        } catch (err: any) {
            setError(err.message || 'Error');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2">
            <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="border p-1 w-full"
                placeholder="Amount"
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
                >
                    Cancel
                </button>
                <button type="submit" className="border px-2 py-1">
                    Save
                </button>
            </div>
        </form>
    );
}
