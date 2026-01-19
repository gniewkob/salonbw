import { FormEvent, useState } from 'react';
import { Review } from '@/types';

interface Props {
    initial?: Partial<Review>;
    onSubmit: (data: {
        appointmentId: number;
        rating: number;
        comment?: string;
    }) => Promise<void>;
    onCancel: () => void;
}

export default function ReviewForm({ initial, onSubmit, onCancel }: Props) {
    const [form, setForm] = useState(() => ({
        appointmentId:
            initial?.appointmentId !== undefined
                ? String(initial.appointmentId)
                : '',
        rating: initial?.rating !== undefined ? String(initial.rating) : '1',
        comment: initial?.comment ?? '',
    }));
    const [error, setError] = useState('');

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const appointmentId = Number(form.appointmentId);
        if (!Number.isFinite(appointmentId) || appointmentId < 1) {
            setError('Appointment is required');
            return;
        }

        const rating = Number(form.rating);
        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
            setError('Rating must be between 1 and 5');
            return;
        }

        const comment = form.comment.trim();

        setError('');
        try {
            await onSubmit({
                appointmentId,
                rating,
                comment,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message || 'Error' : 'Error');
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
            <input
                name="appointmentId"
                value={form.appointmentId}
                onChange={handleChange}
                className="border p-1 w-full"
                placeholder="Appointment"
            />
            {initial?.employee && (
                <input
                    value={initial.employee.fullName}
                    readOnly
                    className="border p-1 w-full bg-gray-100"
                    placeholder="Employee"
                />
            )}
            {initial?.author && (
                <input
                    value={initial.author.name}
                    readOnly
                    className="border p-1 w-full bg-gray-100"
                    placeholder="Author"
                />
            )}
            <input
                name="rating"
                value={form.rating}
                onChange={handleChange}
                className="border p-1 w-full"
                placeholder="Rating"
            />
            <textarea
                name="comment"
                value={form.comment}
                onChange={handleChange}
                className="border p-1 w-full"
                placeholder="Comment"
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
