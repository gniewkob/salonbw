import { FormEvent, useState } from 'react';
import { Client, Employee, Service } from '@/types';

interface Props {
    clients: Client[];
    employees: Employee[];
    services: Service[];
    initial?: {
        startTime?: string;
        clientId?: number;
        employeeId?: number;
        serviceId?: number;
    };
    onSubmit: (data: {
        clientId: number;
        employeeId: number;
        serviceId: number;
        startTime: string;
    }) => Promise<void>;
    onCancel: () => void;
}

export default function AdminAppointmentForm({
    clients,
    employees,
    services,
    initial,
    onSubmit,
    onCancel,
}: Props) {
    const [clientId, setClientId] = useState<number>(
        initial?.clientId ?? clients[0]?.id ?? 0,
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
            await onSubmit({ clientId, employeeId, serviceId, startTime });
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError('Error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
            <select
                className="border p-1 w-full"
                value={clientId}
                onChange={(e) => setClientId(Number(e.target.value))}
            >
                {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                        {c.name}
                    </option>
                ))}
            </select>
            <select
                className="border p-1 w-full"
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
                className="border p-1 w-full"
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
