import { FormEvent, useEffect, useMemo, useState } from 'react';
import * as Select from '@radix-ui/react-select';
import { z } from 'zod';
import { Appointment, Employee, Product } from '@/types';
import { CreateSaleData } from '@/hooks/useRetail';

const schema = z.object({
    productId: z
        .number({
            message: 'Product is required',
        })
        .min(1, { message: 'Product is required' }),
    quantity: z
        .number({
            message: 'Quantity is required',
        })
        .min(1, { message: 'Quantity must be at least 1' }),
    employeeId: z.number().optional(),
    appointmentId: z.number().optional(),
    unitPrice: z
        .number({
            message: 'Unit price must be a number',
        })
        .min(0, { message: 'Unit price must be >= 0' })
        .optional(),
    discount: z
        .number({
            message: 'Discount must be a number',
        })
        .min(0, { message: 'Discount must be >= 0' })
        .optional(),
    note: z.string().max(500, { message: 'Note must be <= 500 characters' }).optional(),
});

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
            productId: productId ? Number(productId) : undefined,
            quantity: quantity !== '' ? Number(quantity) : undefined,
            employeeId: employeeId ? Number(employeeId) : undefined,
            appointmentId: appointmentId ? Number(appointmentId) : undefined,
            unitPrice: unitPrice !== '' ? Number(unitPrice) : undefined,
            discount: discount !== '' ? Number(discount) : undefined,
            note: note.trim() !== '' ? note.trim() : undefined,
        };

        try {
            const data = schema.parse(parsedData);

            setSubmitting(true);
            await onSubmit({
                productId: data.productId,
                quantity: data.quantity,
                employeeId: data.employeeId,
                appointmentId: data.appointmentId,
                unitPrice: data.unitPrice,
                discount: data.discount,
                note: data.note,
            });
        } catch (err: unknown) {
            if (err instanceof z.ZodError) {
                setError(err.issues[0]?.message ?? 'Error');
            } else if (err instanceof Error) {
                setError(err.message || 'Error');
            } else {
                setError('Error');
            }
            return;
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
            <Select.Root value={productId} onValueChange={(value) => setProductId(value)}>
                <Select.Trigger
                    data-testid="product-select"
                    className="border p-1 w-full text-left"
                >
                    <Select.Value placeholder="Select product" />
                </Select.Trigger>
                <Select.Portal>
                    <Select.Content className="border bg-white">
                        <Select.Viewport>
                            {products.map((product) => (
                                <Select.Item
                                    key={product.id}
                                    value={String(product.id)}
                                    data-testid={`product-option-${product.id}`}
                                    className="p-1"
                                >
                                    <Select.ItemText>{product.name}</Select.ItemText>
                                </Select.Item>
                            ))}
                        </Select.Viewport>
                    </Select.Content>
                </Select.Portal>
            </Select.Root>
            <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="border p-1 w-full"
                placeholder="Quantity"
            />
            <Select.Root value={employeeId} onValueChange={(value) => setEmployeeId(value)}>
                <Select.Trigger
                    data-testid="employee-select"
                    className="border p-1 w-full text-left"
                >
                    <Select.Value placeholder="Assign employee (optional)" />
                </Select.Trigger>
                <Select.Portal>
                    <Select.Content className="border bg-white">
                        <Select.Viewport>
                            <Select.Item value="" className="p-1">
                                <Select.ItemText>None</Select.ItemText>
                            </Select.Item>
                            {employees.map((employee) => (
                                <Select.Item
                                    key={employee.id}
                                    value={String(employee.id)}
                                    data-testid={`employee-option-${employee.id}`}
                                    className="p-1"
                                >
                                    <Select.ItemText>{employee.name}</Select.ItemText>
                                </Select.Item>
                            ))}
                        </Select.Viewport>
                    </Select.Content>
                </Select.Portal>
            </Select.Root>
            <Select.Root value={appointmentId} onValueChange={(value) => setAppointmentId(value)}>
                <Select.Trigger
                    data-testid="appointment-select"
                    className="border p-1 w-full text-left"
                >
                    <Select.Value placeholder="Link appointment (optional)" />
                </Select.Trigger>
                <Select.Portal>
                    <Select.Content className="border bg-white">
                        <Select.Viewport>
                            <Select.Item value="" className="p-1">
                                <Select.ItemText>None</Select.ItemText>
                            </Select.Item>
                            {appointments.map((appointment) => (
                                <Select.Item
                                    key={appointment.id}
                                    value={String(appointment.id)}
                                    data-testid={`appointment-option-${appointment.id}`}
                                    className="p-1"
                                >
                                    <Select.ItemText>
                                        {appointment.client?.name ?? 'Unknown client'} ·{' '}
                                        {appointment.service?.name ?? 'Service'} ·{' '}
                                        {new Date(appointment.startTime).toLocaleString()}
                                    </Select.ItemText>
                                </Select.Item>
                            ))}
                        </Select.Viewport>
                    </Select.Content>
                </Select.Portal>
            </Select.Root>
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
                <button type="submit" className="border px-2 py-1" disabled={submitting}>
                    {submitting ? 'Saving…' : 'Save'}
                </button>
            </div>
        </form>
    );
}
