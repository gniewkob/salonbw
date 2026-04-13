import { FormEvent, useState } from 'react';
import { Customer, Employee, Service } from '@/types';

interface Props {
    customers: Customer[];
    employees: Employee[];
    services: Service[];
    initial?: {
        startTime?: string;
        customerId?: number;
        employeeId?: number;
        serviceId?: number;
    };
    onSubmit: (data: {
        customerId: number;
        employeeId: number;
        serviceId: number;
        startTime: string;
    }) => Promise<void>;
    onCancel: () => void;
}

export default function AdminAppointmentForm({
    customers,
    employees,
    services,
    initial,
    onSubmit,
    onCancel,
}: Props) {
    const [customerId, setCustomerId] = useState<number>(
        initial?.customerId ?? customers[0]?.id ?? 0,
    );
    const [employeeId, setEmployeeId] = useState<number>(
        initial?.employeeId ?? employees[0]?.id ?? 0,
    );
    const [serviceId, setServiceId] = useState<number>(
        initial?.serviceId ?? services[0]?.id ?? 0,
    );
    const [startTime, setStartTime] = useState<string>(
        initial?.startTime ?? '',
    );
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            setSubmitting(true);
            await onSubmit({ customerId, employeeId, serviceId, startTime });
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message || 'Wystąpił błąd');
            else setError('Wystąpił błąd');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="gap-2">
            <select
                className="border p-1 w-100"
                value={customerId}
                onChange={(e) => setCustomerId(Number(e.target.value))}
            >
                {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                        {c.name}
                    </option>
                ))}
            </select>
            <select
                className="border p-1 w-100"
                value={employeeId}
                onChange={(e) => setEmployeeId(Number(e.target.value))}
            >
                {employees.map((em) => (
                    <option key={em.id} value={em.id}>
                        {em.name || em.fullName || `#${em.id}`}
                    </option>
                ))}
            </select>
            <select
                className="border p-1 w-100"
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
