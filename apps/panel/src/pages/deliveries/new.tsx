'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useWarehouseProducts } from '@/hooks/useWarehouseViews';
import { useCreateDelivery, useSuppliers } from '@/hooks/useWarehouse';

interface DeliveryLineForm {
    productId: string;
    quantity: string;
    unitCost: string;
}

export default function WarehouseDeliveryCreatePage() {
    const router = useRouter();
    const { data: products = [] } = useWarehouseProducts({
        includeInactive: false,
    });
    const { data: suppliers = [] } = useSuppliers();
    const createDelivery = useCreateDelivery();

    const [supplierId, setSupplierId] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [deliveryDate, setDeliveryDate] = useState(
        new Date().toISOString().slice(0, 10),
    );
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState<DeliveryLineForm[]>([
        { productId: '', quantity: '1', unitCost: '0' },
    ]);

    const addLine = () => {
        setLines((current) => [
            ...current,
            { productId: '', quantity: '1', unitCost: '0' },
        ]);
    };

    const updateLine = (index: number, next: Partial<DeliveryLineForm>) => {
        setLines((current) =>
            current.map((line, lineIndex) =>
                lineIndex === index ? { ...line, ...next } : line,
            ),
        );
    };

    const removeLine = (index: number) => {
        setLines((current) =>
            current.filter((_, lineIndex) => lineIndex !== index),
        );
    };

    const submit = async () => {
        const items = lines
            .filter((line) => line.productId)
            .map((line) => ({
                productId: Number(line.productId),
                quantity: Number(line.quantity || 0),
                unitCost: Number(line.unitCost || 0),
            }))
            .filter((line) => line.quantity > 0);
        if (items.length === 0) return;

        await createDelivery.mutateAsync({
            supplierId: supplierId ? Number(supplierId) : undefined,
            deliveryDate,
            invoiceNumber: invoiceNumber || undefined,
            notes: notes || undefined,
            items,
        });

        await router.push('/deliveries/history');
    };

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Dodaj dostawę | SalonBW"
            heading="Magazyn / Dodaj dostawę"
            activeTab="deliveries"
            actions={
                <Link
                    href="/deliveries/history"
                    className="rounded border border-sky-500 px-3 py-1.5 text-sm text-sky-500 hover:bg-sky-50"
                >
                    historia dostaw
                </Link>
            }
        >
            <div className="overflow-x-auto border border-gray-200">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 text-left text-xs uppercase text-gray-600">
                        <tr>
                            <th className="px-2 py-2">nazwa</th>
                            <th className="px-2 py-2">ilość</th>
                            <th className="px-2 py-2">cena/op. (netto)</th>
                            <th className="px-2 py-2">usuń</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lines.map((line, index) => (
                            <tr
                                key={`${index}-${line.productId}`}
                                className="border-t border-gray-200"
                            >
                                <td className="px-2 py-2">
                                    <select
                                        value={line.productId}
                                        onChange={(event) =>
                                            updateLine(index, {
                                                productId: event.target.value,
                                            })
                                        }
                                        className="w-full rounded border border-gray-300 px-2 py-1.5"
                                    >
                                        <option value="">
                                            wpisz nazwę, kod kreskowy itp.
                                        </option>
                                        {products.map((product) => (
                                            <option
                                                key={product.id}
                                                value={product.id}
                                            >
                                                {product.name}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-2 py-2">
                                    <input
                                        type="number"
                                        min={1}
                                        value={line.quantity}
                                        onChange={(event) =>
                                            updateLine(index, {
                                                quantity: event.target.value,
                                            })
                                        }
                                        className="w-24 rounded border border-gray-300 px-2 py-1.5"
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={line.unitCost}
                                        onChange={(event) =>
                                            updateLine(index, {
                                                unitCost: event.target.value,
                                            })
                                        }
                                        className="w-28 rounded border border-gray-300 px-2 py-1.5"
                                    />
                                </td>
                                <td className="px-2 py-2 text-center">
                                    <button
                                        type="button"
                                        className="text-red-500 hover:text-red-700"
                                        onClick={() => removeLine(index)}
                                    >
                                        x
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-2">
                <button
                    type="button"
                    className="rounded border border-sky-500 px-3 py-1.5 text-sm text-sky-500 hover:bg-sky-50"
                    onClick={addLine}
                >
                    dodaj kolejną pozycję
                </button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
                <label className="text-sm">
                    <span className="mb-1 block">Dostawca</span>
                    <select
                        value={supplierId}
                        onChange={(event) => setSupplierId(event.target.value)}
                        className="w-full rounded border border-gray-300 px-2 py-1.5"
                    >
                        <option value="">
                            wpisz nazwę lub wybierz z listy
                        </option>
                        {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>
                                {supplier.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="text-sm">
                    <span className="mb-1 block">Numer faktury</span>
                    <input
                        type="text"
                        value={invoiceNumber}
                        onChange={(event) =>
                            setInvoiceNumber(event.target.value)
                        }
                        className="w-full rounded border border-gray-300 px-2 py-1.5"
                    />
                </label>
                <label className="text-sm">
                    <span className="mb-1 block">Wystawiono</span>
                    <input
                        type="date"
                        value={deliveryDate}
                        onChange={(event) =>
                            setDeliveryDate(event.target.value)
                        }
                        className="w-full rounded border border-gray-300 px-2 py-1.5"
                    />
                </label>
                <label className="text-sm md:col-span-2">
                    <span className="mb-1 block">Uwagi</span>
                    <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        className="h-28 w-full rounded border border-gray-300 px-2 py-1.5"
                    />
                </label>
            </div>

            <div className="mt-6">
                <button
                    type="button"
                    className="rounded bg-sky-500 px-4 py-2 text-sm text-white hover:bg-sky-600 disabled:opacity-60"
                    onClick={() => void submit()}
                    disabled={createDelivery.isPending}
                >
                    {createDelivery.isPending
                        ? 'zapisywanie...'
                        : 'wprowadź dostawę'}
                </button>
            </div>
        </WarehouseLayout>
    );
}
