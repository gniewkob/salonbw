import { FormEvent, useState } from 'react';
import { z } from 'zod';
import { Review } from '@/types';

const schema = z.object({
  reservationId: z.coerce.number().min(1, { message: 'Reservation is required' }),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().optional(),
});

interface Props {
  initial?: Partial<Review>;
  onSubmit: (data: { reservationId: number; rating: number; comment?: string }) => Promise<void>;
  onCancel: () => void;
}

export default function ReviewForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState({
    reservationId: initial?.reservationId ?? 0,
    rating: initial?.rating ?? 1,
    comment: initial?.comment ?? '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const data = schema.parse(form);
      await onSubmit(data);
    } catch (err: any) {
      if (err.errors) setError(err.errors[0].message);
      else setError('Error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input name="reservationId" value={form.reservationId} onChange={handleChange} className="border p-1 w-full" placeholder="Reservation" />
      <input name="rating" value={form.rating} onChange={handleChange} className="border p-1 w-full" placeholder="Rating" />
      <textarea name="comment" value={form.comment} onChange={handleChange} className="border p-1 w-full" placeholder="Comment" />
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
