import { FormEvent, useState } from 'react';
import { z } from 'zod';
import { Product } from '@/types';

const schema = z.object({
    name: z.string().min(1, { message: 'Name is required' }),
    unitPrice: z.coerce.number().min(0, { message: 'Price must be >= 0' }),
    stock: z.coerce.number().min(0, { message: 'Stock must be >= 0' }),
    lowStockThreshold: z.coerce
        .number()
        .min(0, { message: 'Low stock threshold must be >= 0' }),
    brand: z.string().optional(),
});

interface Props {
    initial?: Partial<Product>;
    onSubmit: (data: {
        name: string;
        unitPrice: number;
        stock: number;
        lowStockThreshold: number;
        brand?: string;
    }) => Promise<void>;
    onCancel: () => void;
}

export default function ProductForm({ initial, onSubmit, onCancel }: Props) {
    const [form, setForm] = useState({
        name: initial?.name ?? '',
        unitPrice: initial?.unitPrice ?? 0,
        stock: initial?.stock ?? 0,
        lowStockThreshold: initial?.lowStockThreshold ?? 5,
        brand: initial?.brand ?? '',
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const data = schema.parse(form);
            setSubmitting(true);
            await onSubmit(data);
        } catch (err: unknown) {
            if (err instanceof z.ZodError)
                setError(err.issues[0]?.message ?? 'Error');
            else setError('Error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
            <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="border p-1 w-full"
                placeholder="Name"
            />
            <input
                name="brand"
                value={form.brand}
                onChange={handleChange}
                className="border p-1 w-full"
                placeholder="Brand"
            />
            <input
                name="unitPrice"
                value={form.unitPrice}
                onChange={handleChange}
                className="border p-1 w-full"
                placeholder="Price"
            />
            <input
                name="stock"
                value={form.stock}
                onChange={handleChange}
                className="border p-1 w-full"
                placeholder="Stock"
            />
            <input
                name="lowStockThreshold"
                value={form.lowStockThreshold}
                onChange={handleChange}
                className="border p-1 w-full"
                placeholder="Low Stock Threshold"
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
