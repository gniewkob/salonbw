import { FormEvent, useState } from 'react';
import { Service } from '@/types';

interface Props {
    services: Service[];
    initial?: { serviceId?: number; startTime?: string };
    onSubmit: (data: { serviceId: number; startTime: string }) => Promise<void>;
    onCancel: () => void;
}

export default function AppointmentForm({
    services,
    initial,
    onSubmit,
    onCancel,
}: Props) {
    const [serviceId, setServiceId] = useState(
        initial?.serviceId ?? services[0]?.id,
    );
    const [startTime, setStartTime] = useState(initial?.startTime ?? '');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            setSubmitting(true);
            await onSubmit({ serviceId: Number(serviceId), startTime });
        } catch (err: unknown) {
            if (
                typeof err === 'object' &&
                err !== null &&
                'status' in err &&
                (err as { status?: number }).status === 409
            ) {
                setError('Conflict');
            } else if (err instanceof Error) {
                setError(err.message || 'Error');
            } else {
                setError('Error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
            <select
                className="border p-1 w-full"
                data-testid="service-select"
                value={serviceId}
                onChange={(e) => setServiceId(Number(e.target.value))}
            >
                {services.map((s) => (
                    <option key={s.id} value={s.id}>
                        {s.name}
                    </option>
                ))}
            </select>
            <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="border p-1 w-full"
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
