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
                setError('Wybrany termin jest już zajęty');
            } else if (err instanceof Error) {
                setError(err.message || 'Wystąpił błąd');
            } else {
                setError('Wystąpił błąd');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="gap-2">
            <select
                className="border p-1 w-100"
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
                className="border p-1 w-100"
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
