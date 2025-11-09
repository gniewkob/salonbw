import { FormEvent, useState } from 'react';
import { Client } from '@/types';

interface Props {
    initial?: Partial<Client>;
    onSubmit: (data: { name: string }) => Promise<void>;
    onCancel: () => void;
}

export default function ClientForm({ initial, onSubmit, onCancel }: Props) {
    const [name, setName] = useState(initial?.name ?? '');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setError('Name is required');
            return;
        }

        setError('');
        setSubmitting(true);
        try {
            await onSubmit({ name: trimmed });
        } catch (err) {
            setError(err instanceof Error ? err.message || 'Error' : 'Error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border p-1 w-full"
                placeholder="Name"
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
                <button
                    type="submit"
                    className="border px-2 py-1"
                    disabled={submitting}
                >
                    {submitting ? 'Saving…' : 'Save'}
                </button>
            </div>
        </form>
    );
}
