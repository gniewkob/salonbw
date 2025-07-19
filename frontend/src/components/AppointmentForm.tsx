import { FormEvent, useState } from 'react';
import { Client, Service } from '@/types';

interface Props {
  clients: Client[];
  services: Service[];
  initial?: { clientId?: number; serviceId?: number; startTime?: string };
  onSubmit: (data: { clientId: number; serviceId: number; startTime: string }) => Promise<void>;
  onCancel: () => void;
}

export default function AppointmentForm({ clients, services, initial, onSubmit, onCancel }: Props) {
  const [clientId, setClientId] = useState(initial?.clientId ?? clients[0]?.id);
  const [serviceId, setServiceId] = useState(initial?.serviceId ?? services[0]?.id);
  const [startTime, setStartTime] = useState(initial?.startTime ?? '');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await onSubmit({ clientId: Number(clientId), serviceId: Number(serviceId), startTime });
    } catch (err: any) {
      if (err.status === 409) setError('Conflict');
      else setError(err.message || 'Error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <select value={clientId} onChange={(e) => setClientId(Number(e.target.value))} className="border p-1 w-full">
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select value={serviceId} onChange={(e) => setServiceId(Number(e.target.value))} className="border p-1 w-full">
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
        <button type="button" onClick={onCancel} className="border px-2 py-1">
          Cancel
        </button>
        <button type="submit" className="border px-2 py-1">
          Save
        </button>
      </div>
    </form>
  );
}
