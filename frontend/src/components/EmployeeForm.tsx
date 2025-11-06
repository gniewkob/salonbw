import { FormEvent, useState } from 'react';
import { Employee } from '@/types';

interface Props {
    initial?: Partial<Employee>;
    onSubmit: (data: { firstName: string; lastName: string }) => Promise<void>;
    onCancel: () => void;
}

export default function EmployeeForm({ initial, onSubmit, onCancel }: Props) {
    const [firstName, setFirstName] = useState(initial?.firstName ?? '');
    const [lastName, setLastName] = useState(initial?.lastName ?? '');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const trimmedFirst = firstName.trim();
        const trimmedLast = lastName.trim();
        if (!trimmedFirst) {
            setError('First name is required');
            return;
        }
        if (!trimmedLast) {
            setError('Last name is required');
            return;
        }

        setError('');
        setSubmitting(true);
        try {
            await onSubmit({ firstName: trimmedFirst, lastName: trimmedLast });
        } catch (err) {
            setError(err instanceof Error ? err.message || 'Error' : 'Error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
            <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="border p-1 w-full"
                placeholder="First name"
            />
            <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="border p-1 w-full"
                placeholder="Last name"
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
