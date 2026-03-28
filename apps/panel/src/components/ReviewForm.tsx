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
    const initialAppointmentId =
        initial?.appointmentId ?? initial?.appointment?.id;
    const [form, setForm] = useState(() => ({
        appointmentId:
            initialAppointmentId !== undefined
                ? String(initialAppointmentId)
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
        <form onSubmit={(e) => void handleSubmit(e)} className="gap-2">
            <input
                name="appointmentId"
                value={form.appointmentId}
                onChange={handleChange}
                className="border p-1 w-100"
                placeholder="Appointment"
            />
            {initial?.employee && (
                <input
                    value={initial.employee.fullName}
                    readOnly
                    className="border p-1 w-100 bg-light"
                    placeholder="Employee"
                />
            )}
            {(initial?.author ?? initial?.client) && (
                <input
                    value={(initial.author ?? initial.client)?.name ?? ''}
                    readOnly
                    className="border p-1 w-100 bg-light"
                    placeholder="Author"
                />
            )}
            <input
                name="rating"
                value={form.rating}
                onChange={handleChange}
                className="border p-1 w-100"
                placeholder="Rating"
            />
            <textarea
                name="comment"
                value={form.comment}
                onChange={handleChange}
                className="border p-1 w-100"
                placeholder="Comment"
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
                    Cancel
                </button>
                <button type="submit" className="border px-2 py-1">
                    Save
                </button>
            </div>
        </form>
    );
}
