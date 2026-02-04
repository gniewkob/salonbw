'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import {
    useCreateWarehouseUsage,
    useWarehouseProducts,
} from '@/hooks/useWarehouseViews';
import { useEmployees } from '@/hooks/useEmployees';

interface UsageLineForm {
    productId: string;
    quantity: string;
}

export default function WarehouseUsageCreatePage() {
    const router = useRouter();
    const { data: products = [] } = useWarehouseProducts({
        includeInactive: false,
    });
    const { data: employees = [] } = useEmployees();
    const createMutation = useCreateWarehouseUsage();

    const [lines, setLines] = useState<UsageLineForm[]>([
        { productId: '', quantity: '1' },
    ]);
    const [clientName, setClientName] = useState('');
    const [employeeId, setEmployeeId] = useState('');

    const addLine = () => {
        setLines((current) => [...current, { productId: '', quantity: '1' }]);
    };

    const updateLine = (index: number, next: Partial<UsageLineForm>) => {
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
            }))
            .filter((line) => line.quantity > 0);

        if (items.length === 0) return;

        await createMutation.mutateAsync({
            clientName: clientName || undefined,
            employeeId: employeeId ? Number(employeeId) : undefined,
            items,
        });

        await router.push('/use/history');
    };

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Dodaj zużycie | SalonBW"
            heading="Magazyn / Dodaj zużycie"
            activeTab="use"
            actions={
                <Link
                    href="/use/history"
                    className="rounded border border-sky-500 px-3 py-1.5 text-sm text-sky-500 hover:bg-sky-50"
                >
                    historia zużycia
                </Link>
            }
        >
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
                        placeholder="wpisz nazwisko lub imię klienta"
                    />
                </label>
                <label className="text-sm">
                    <span className="mb-1 block">
                        Pracownik, który zużył materiał
                    </span>
                    <select
                        value={employeeId}
                        onChange={(event) => setEmployeeId(event.target.value)}
                        className="w-full rounded border border-gray-300 px-2 py-1.5"
                    >
                        <option value="">
                            wpisz nazwę lub wybierz z listy
                        </option>
                        {employees?.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                                {employee.name}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="mt-6">
                <button
                    type="button"
                    className="rounded bg-sky-500 px-4 py-2 text-sm text-white hover:bg-sky-600 disabled:opacity-60"
                    onClick={() => void submit()}
                    disabled={createMutation.isPending}
                >
                    {createMutation.isPending
                        ? 'zapisywanie...'
                        : 'wprowadź zużycie'}
                </button>
            </div>
        </WarehouseLayout>
    );
}
