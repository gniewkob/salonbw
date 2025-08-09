import { FormEvent, useState } from 'react';
import { z } from 'zod';
import { Client } from '@/types';

const schema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
});

interface Props {
  initial?: Partial<Client>;
  onSubmit: (data: { name: string }) => Promise<void>;
  onCancel: () => void;
}

export default function ClientForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const data = schema.parse({ name });
      await onSubmit(data);
    } catch (err: unknown) {
      if (err instanceof z.ZodError) setError(err.issues[0]?.message ?? 'Error');
      else setError('Error');
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-1 w-full"
        placeholder="Name"
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
