'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import {
    useCreateWarehouseOrder,
    useWarehouseProducts,
} from '@/hooks/useWarehouseViews';
import { useSuppliers } from '@/hooks/useWarehouse';

interface OrderLineForm {
    productId: string;
    productName: string;
    quantity: string;
}

export default function WarehouseOrderCreatePage() {
    const router = useRouter();
    const { data: suppliers = [] } = useSuppliers();
    const { data: products = [] } = useWarehouseProducts({
        includeInactive: false,
    });
    const createMutation = useCreateWarehouseOrder();

    const [supplierId, setSupplierId] = useState('');
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState<OrderLineForm[]>([
        { productId: '', productName: '', quantity: '1' },
    ]);

    const addLine = () => {
        setLines((current) => [
            ...current,
            { productId: '', productName: '', quantity: '1' },
        ]);
    };

    const updateLine = (index: number, next: Partial<OrderLineForm>) => {
        setLines((current) =>
            current.map((line, lineIndex) =>
                lineIndex === index ? { ...line, ...next } : line,
            ),
        );
    };

    const submit = async () => {
        const items = lines
            .map((line) => ({
                productId: line.productId ? Number(line.productId) : undefined,
                productName: line.productName || undefined,
                quantity: Number(line.quantity || 0),
            }))
            .filter(
                (line) =>
                    line.quantity > 0 && (line.productId || line.productName),
            );

        if (items.length === 0) return;

        await createMutation.mutateAsync({
            supplierId: supplierId ? Number(supplierId) : undefined,
            notes: notes || undefined,
            items,
        });

        await router.push('/orders/history');
    };

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Dodaj zamówienie | SalonBW"
            heading="Magazyn / Dodaj zamówienie"
            activeTab="orders"
            actions={
                <Link
                    href="/orders/history"
                    className="rounded border border-sky-500 px-3 py-1.5 text-sm text-sky-500 hover:bg-sky-50"
                >
                    historia zamówień
                </Link>
            }
        >
            <div className="grid gap-3 md:grid-cols-2">
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
            </div>

            <h2 className="mb-3 mt-5 text-[34px] leading-none text-gray-800">
                Pozycje zamówienia
            </h2>
            <div className="overflow-x-auto border border-gray-200">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 text-left text-xs uppercase text-gray-600">
                        <tr>
                            <th className="px-2 py-2">nazwa</th>
                            <th className="px-2 py-2">ilość</th>
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
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            const product = products.find(
                                                (item) =>
                                                    String(item.id) === value,
                                            );
                                            updateLine(index, {
                                                productId: value,
                                                productName:
                                                    product?.name ?? '',
                                            });
                                        }}
                                        className="mb-2 w-full rounded border border-gray-300 px-2 py-1.5"
                                    >
                                        <option value="">
                                            wybierz produkt
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
                                    <input
                                        type="text"
                                        value={line.productName}
                                        onChange={(event) =>
                                            updateLine(index, {
                                                productName: event.target.value,
                                            })
                                        }
                                        className="w-full rounded border border-gray-300 px-2 py-1.5"
                                        placeholder="nazwa alternatywna"
                                    />
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
                                <td className="px-2 py-2 text-center">
                                    <button
                                        type="button"
                                        className="text-red-500 hover:text-red-700"
                                        onClick={() =>
                                            setLines((current) =>
                                                current.filter(
                                                    (_, lineIndex) =>
                                                        lineIndex !== index,
                                                ),
                                            )
                                        }
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

            <label className="mt-6 block text-sm">
                <span className="mb-1 block">Uwagi</span>
                <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="h-28 w-full rounded border border-gray-300 px-2 py-1.5"
                />
            </label>

            <div className="mt-6">
                <button
                    type="button"
                    className="rounded bg-sky-500 px-4 py-2 text-sm text-white hover:bg-sky-600 disabled:opacity-60"
                    onClick={() => void submit()}
                    disabled={createMutation.isPending}
                >
                    {createMutation.isPending
                        ? 'zapisywanie...'
                        : 'wyślij zamówienie'}
                </button>
            </div>
        </WarehouseLayout>
    );
}
