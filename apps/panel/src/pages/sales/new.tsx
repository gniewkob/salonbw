'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import {
    useWarehouseProducts,
    useCreateWarehouseSale,
} from '@/hooks/useWarehouseViews';
import { useEmployees } from '@/hooks/useEmployees';

interface SaleLineForm {
    productId: string;
    quantity: string;
    unitPrice: string;
    discount: string;
}

export default function WarehouseSaleCreatePage() {
    const router = useRouter();
    const { data: products = [] } = useWarehouseProducts({
        includeInactive: false,
    });
    const { data: employees = [] } = useEmployees();
    const createMutation = useCreateWarehouseSale();

    const [lines, setLines] = useState<SaleLineForm[]>([
        { productId: '', quantity: '1', unitPrice: '', discount: '0' },
    ]);
    const [clientName, setClientName] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [soldAt, setSoldAt] = useState(new Date().toISOString().slice(0, 10));
    const [note, setNote] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');

    const totalGross = useMemo(() => {
        return lines.reduce((sum, line) => {
            const price = Number(line.unitPrice || 0);
            const qty = Number(line.quantity || 0);
            const discount = Number(line.discount || 0);
            return sum + Math.max(0, price * qty - discount);
        }, 0);
    }, [lines]);

    const addLine = () => {
        setLines((current) => [
            ...current,
            { productId: '', quantity: '1', unitPrice: '', discount: '0' },
        ]);
    };

    const updateLine = (index: number, next: Partial<SaleLineForm>) => {
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
        const payloadItems = lines
            .filter((line) => line.productId)
            .map((line) => ({
                productId: Number(line.productId),
                quantity: Number(line.quantity || 0),
                unitPrice: Number(line.unitPrice || 0),
                discount: Number(line.discount || 0),
            }))
            .filter((item) => item.quantity > 0);

        if (payloadItems.length === 0) return;

        const created = await createMutation.mutateAsync({
            soldAt: soldAt
                ? new Date(`${soldAt}T12:00:00`).toISOString()
                : undefined,
            clientName: clientName || undefined,
            employeeId: employeeId ? Number(employeeId) : undefined,
            paymentMethod,
            note: note || undefined,
            items: payloadItems,
        });

        await router.push(`/sales/history/${created.id}`);
    };

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Dodaj sprzedaż | SalonBW"
            heading="Magazyn / Dodaj sprzedaż"
            activeTab="sales"
            actions={
                <div className="text-right">
                    <Link
                        href="/sales/history"
                        className="rounded border border-sky-500 px-3 py-1.5 text-sm text-sky-500 hover:bg-sky-50"
                    >
                        historia sprzedaży
                    </Link>
                </div>
            }
        >
            <div className="overflow-x-auto border border-gray-200">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 text-left text-xs uppercase text-gray-600">
                        <tr>
                            <th className="px-2 py-2">nazwa</th>
                            <th className="px-2 py-2">ilość</th>
                            <th className="px-2 py-2">cena op. (brutto)</th>
                            <th className="px-2 py-2">rabat</th>
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
                                                unitPrice: product
                                                    ? String(product.unitPrice)
                                                    : line.unitPrice,
                                            });
                                        }}
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
                                        className="w-20 rounded border border-gray-300 px-2 py-1.5"
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={line.unitPrice}
                                        onChange={(event) =>
                                            updateLine(index, {
                                                unitPrice: event.target.value,
                                            })
                                        }
                                        className="w-32 rounded border border-gray-300 px-2 py-1.5"
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={line.discount}
                                        onChange={(event) =>
                                            updateLine(index, {
                                                discount: event.target.value,
                                            })
                                        }
                                        className="w-24 rounded border border-gray-300 px-2 py-1.5"
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
                    <span className="mb-1 block">Klient</span>
                    <input
                        type="text"
                        value={clientName}
                        onChange={(event) => setClientName(event.target.value)}
                        className="w-full rounded border border-gray-300 px-2 py-1.5"
                        placeholder="wpisz nazwisko lub numer telefonu"
                    />
                </label>
                <label className="text-sm">
                    <span className="mb-1 block">Polecający pracownik</span>
                    <select
                        value={employeeId}
                        onChange={(event) => setEmployeeId(event.target.value)}
                        className="w-full rounded border border-gray-300 px-2 py-1.5"
                    >
                        <option value="">wpisz nazwę lub wybierz z listy</option>
                        {employees?.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                                {employee.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="text-sm">
                    <span className="mb-1 block">Data sprzedaży</span>
                    <input
                        type="date"
                        value={soldAt}
                        onChange={(event) => setSoldAt(event.target.value)}
                        className="w-full rounded border border-gray-300 px-2 py-1.5"
                    />
                </label>
                <label className="text-sm">
                    <span className="mb-1 block">Płatność</span>
                    <select
                        value={paymentMethod}
                        onChange={(event) => setPaymentMethod(event.target.value)}
                        className="w-full rounded border border-gray-300 px-2 py-1.5"
                    >
                        <option value="cash">gotówka</option>
                        <option value="card">karta</option>
                        <option value="transfer">przelew</option>
                    </select>
                </label>
                <label className="text-sm md:col-span-2">
                    <span className="mb-1 block">Opis</span>
                    <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        className="h-28 w-full rounded border border-gray-300 px-2 py-1.5"
                    />
                </label>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="mb-3 text-right text-2xl font-semibold">
                    Wartość sprzedaży: {totalGross.toFixed(2)} zł
                </div>
                <button
                    type="button"
                    className="rounded bg-sky-500 px-4 py-2 text-sm text-white hover:bg-sky-600 disabled:opacity-60"
                    onClick={() => void submit()}
                    disabled={createMutation.isPending}
                >
                    {createMutation.isPending
                        ? 'zapisywanie...'
                        : 'wprowadź sprzedaż'}
                </button>
            </div>
        </WarehouseLayout>
    );
}
