import { FormEvent, useState } from 'react';
import { z } from 'zod';
import { Product } from '@/types';

const schema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  unitPrice: z.coerce.number().min(0, { message: 'Price must be >= 0' }),
  stock: z.coerce.number().min(0, { message: 'Stock must be >= 0' }),
  brand: z.string().optional(),
});

interface Props {
  initial?: Partial<Product>;
  onSubmit: (data: { name: string; unitPrice: number; stock: number; brand?: string }) => Promise<void>;
  onCancel: () => void;
}

export default function ProductForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    unitPrice: initial?.unitPrice ?? 0,
    stock: initial?.stock ?? 0,
    brand: initial?.brand ?? '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      <input name="name" value={form.name} onChange={handleChange} className="border p-1 w-full" placeholder="Name" />
      <input name="brand" value={form.brand} onChange={handleChange} className="border p-1 w-full" placeholder="Brand" />
      <input name="unitPrice" value={form.unitPrice} onChange={handleChange} className="border p-1 w-full" placeholder="Price" />
      <input name="stock" value={form.stock} onChange={handleChange} className="border p-1 w-full" placeholder="Stock" />
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
