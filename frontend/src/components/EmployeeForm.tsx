import { FormEvent, useState } from 'react';
import { z } from 'zod';
import { Employee } from '@/types';

const schema = z.object({
    firstName: z.string().min(1, { message: 'First name is required' }),
    lastName: z.string().min(1, { message: 'Last name is required' }),
});

interface Props {
    initial?: Partial<Employee>;
    onSubmit: (data: { firstName: string; lastName: string }) => Promise<void>;
    onCancel: () => void;
}

export default function EmployeeForm({ initial, onSubmit, onCancel }: Props) {
    const [firstName, setFirstName] = useState(initial?.firstName ?? '');
    const [lastName, setLastName] = useState(initial?.lastName ?? '');
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const data = schema.parse({ firstName, lastName });
            await onSubmit(data);
        } catch (err: unknown) {
            if (err instanceof z.ZodError)
                setError(err.issues[0]?.message ?? 'Error');
            else setError('Error');
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
                <button type="submit" className="border px-2 py-1">
                    Save
                </button>
            </div>
        </form>
    );
}
