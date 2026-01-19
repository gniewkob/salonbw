import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Appointment, Employee, Product } from '@/types';
import { CreateSaleData } from '@/hooks/useRetail';

interface Props {
    products: Product[];
    employees: Employee[];
    appointments: Appointment[];
    onSubmit: (data: CreateSaleData) => Promise<void>;
    onCancel: () => void;
}

export default function SaleForm({
    products,
    employees,
    appointments,
    onSubmit,
    onCancel,
}: Props) {
    const firstProductId = useMemo(
        () => (products.length > 0 ? String(products[0].id) : ''),
        [products],
    );
    const [productId, setProductId] = useState(firstProductId);
    const [quantity, setQuantity] = useState('1');
    const [employeeId, setEmployeeId] = useState('');
    const [appointmentId, setAppointmentId] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [discount, setDiscount] = useState('0');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!productId && firstProductId) {
            setProductId(firstProductId);
        }
    }, [firstProductId, productId]);

    useEffect(() => {
        const product = products.find((p) => String(p.id) === productId);
        if (product) {
            setUnitPrice(product.unitPrice.toString());
        } else {
            setUnitPrice('');
        }
    }, [productId, products]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        const parsedData = {
            productId: productId ? Number(productId) : NaN,
            quantity: quantity !== '' ? Number(quantity) : NaN,
            employeeId: employeeId ? Number(employeeId) : undefined,
            appointmentId: appointmentId ? Number(appointmentId) : undefined,
            unitPrice: unitPrice !== '' ? Number(unitPrice) : undefined,
            discount: discount !== '' ? Number(discount) : undefined,
            note: note.trim() !== '' ? note.trim() : undefined,
        };

        if (
            !Number.isFinite(parsedData.productId) ||
            parsedData.productId < 1
        ) {
            setError('Product is required');
            return;
        }

        if (!Number.isFinite(parsedData.quantity) || parsedData.quantity < 1) {
            setError('Quantity must be at least 1');
            return;
        }

        if (
            parsedData.unitPrice !== undefined &&
            (!Number.isFinite(parsedData.unitPrice) || parsedData.unitPrice < 0)
        ) {
            setError('Unit price must be >= 0');
            return;
        }

        if (
            parsedData.discount !== undefined &&
            (!Number.isFinite(parsedData.discount) || parsedData.discount < 0)
        ) {
            setError('Discount must be >= 0');
            return;
        }

        if (parsedData.note && parsedData.note.length > 500) {
            setError('Note must be <= 500 characters');
            return;
        }

        setError('');
        setSubmitting(true);
        try {
            await onSubmit({
                productId: parsedData.productId,
                quantity: parsedData.quantity,
                employeeId: parsedData.employeeId,
                appointmentId: parsedData.appointmentId,
                unitPrice: parsedData.unitPrice,
                discount: parsedData.discount,
                note: parsedData.note,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message || 'Error' : 'Error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSelectOption =
        (setter: (value: string) => void) =>
        (event: React.MouseEvent<HTMLSelectElement>) => {
            const option = event.target as HTMLOptionElement | null;
            if (option && typeof option.value === 'string') {
                setter(option.value);
            }
        };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
            <select
                data-testid="product-select"
                className="border p-1 w-full"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                onClick={handleSelectOption(setProductId)}
            >
                {products.map((product) => (
                    <option
                        key={product.id}
                        value={product.id}
                        data-testid={`product-option-${product.id}`}
                    >
                        {product.name}
                    </option>
                ))}
            </select>
            <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="border p-1 w-full"
                placeholder="Quantity"
            />
            <select
                data-testid="employee-select"
                className="border p-1 w-full"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                onClick={handleSelectOption(setEmployeeId)}
            >
                <option value="">None</option>
                {employees.map((employee) => (
                    <option
                        key={employee.id}
                        value={employee.id}
                        data-testid={`employee-option-${employee.id}`}
                    >
                        {employee.name}
                    </option>
                ))}
            </select>
            <select
                data-testid="appointment-select"
                className="border p-1 w-full"
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                onClick={handleSelectOption(setAppointmentId)}
            >
                <option value="">None</option>
                {appointments.map((appointment) => (
                    <option
                        key={appointment.id}
                        value={appointment.id}
                        data-testid={`appointment-option-${appointment.id}`}
                    >
                        {appointment.client?.name ?? 'Unknown client'} ·{' '}
                        {appointment.service?.name ?? 'Service'} ·{' '}
                        {new Date(appointment.startTime).toLocaleString()}
                    </option>
                ))}
            </select>
            <input
                type="number"
                step="0.01"
                min={0}
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="border p-1 w-full"
                placeholder="Unit price override"
            />
            <input
                type="number"
                step="0.01"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="border p-1 w-full"
                placeholder="Discount"
            />
            <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="border p-1 w-full"
                placeholder="Note"
                maxLength={500}
                rows={3}
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
                    disabled={submitting}
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
