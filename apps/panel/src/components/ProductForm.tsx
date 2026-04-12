import { FormEvent, useState } from 'react';
import { Product } from '@/types';

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
    const [form, setForm] = useState(() => ({
        name: initial?.name ?? '',
        unitPrice:
            initial?.unitPrice !== undefined ? String(initial.unitPrice) : '',
        stock: initial?.stock !== undefined ? String(initial.stock) : '',
        lowStockThreshold:
            initial?.lowStockThreshold !== undefined
                ? String(initial.lowStockThreshold)
                : '5',
        brand: initial?.brand ?? '',
    }));
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const name = form.name.trim();
        if (!name) {
            setError('Podaj nazwę produktu');
            return;
        }

        const parseNumberField = (
            value: string,
            message: string,
        ): number | null => {
            const parsed = Number(value);
            if (!Number.isFinite(parsed) || parsed < 0) {
                setError(message);
                return null;
            }
            return parsed;
        };

        const unitPrice = parseNumberField(
            form.unitPrice,
            'Cena musi być większa lub równa 0',
        );
        if (unitPrice === null) return;

        const stock = parseNumberField(
            form.stock,
            'Stan magazynowy musi być większy lub równy 0',
        );
        if (stock === null) return;

        const lowStockThreshold = parseNumberField(
            form.lowStockThreshold,
            'Próg niskiego stanu musi być większy lub równy 0',
        );
        if (lowStockThreshold === null) return;

        const brand = form.brand.trim();

        setError('');
        setSubmitting(true);
        try {
            await onSubmit({
                name,
                unitPrice,
                stock,
                lowStockThreshold,
                brand,
            });
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message || 'Wystąpił błąd'
                    : 'Wystąpił błąd',
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="gap-2">
            <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="border p-1 w-100"
                placeholder="Nazwa produktu"
            />
            <input
                name="brand"
                value={form.brand}
                onChange={handleChange}
                className="border p-1 w-100"
                placeholder="Marka"
            />
            <input
                name="unitPrice"
                value={form.unitPrice}
                onChange={handleChange}
                className="border p-1 w-100"
                placeholder="Cena"
            />
            <input
                name="stock"
                value={form.stock}
                onChange={handleChange}
                className="border p-1 w-100"
                placeholder="Stan magazynowy"
            />
            <input
                name="lowStockThreshold"
                value={form.lowStockThreshold}
                onChange={handleChange}
                className="border p-1 w-100"
                placeholder="Próg niskiego stanu"
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
