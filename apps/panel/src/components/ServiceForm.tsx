import { FormEvent, useState } from 'react';
import { Service } from '@/types';

interface Props {
    initial?: Partial<Service>;
    onSubmit: (data: { name: string }) => Promise<void>;
    onCancel: () => void;
}

export default function ServiceForm({ initial, onSubmit, onCancel }: Props) {
    const [name, setName] = useState(initial?.name ?? '');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setError('Podaj nazwę usługi');
            return;
        }

        setError('');
        setSubmitting(true);
        try {
            await onSubmit({ name: trimmed });
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

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="gap-2">
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border p-1 w-100"
                placeholder="Nazwa usługi"
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
