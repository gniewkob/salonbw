'use client';

import { useState } from 'react';
import Link from 'next/link';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useStocktakingHistory } from '@/hooks/useWarehouseViews';
import { useCreateStocktaking } from '@/hooks/useWarehouse';

export default function InventoryHistoryPage() {
    const { data: rows = [], isLoading } = useStocktakingHistory();
    const createMutation = useCreateStocktaking();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [stocktakingDate, setStocktakingDate] = useState(
        new Date().toISOString().slice(0, 10),
    );
    const [notes, setNotes] = useState('');

    const create = async () => {
        const created = await createMutation.mutateAsync({
            stocktakingDate,
            notes: notes || undefined,
        });
        setIsCreateOpen(false);
        setNotes('');
        window.location.href = `/inventory/${created.id}`;
    };

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Inwentaryzacja | SalonBW"
            heading="Magazyn / Inwentaryzacja"
            activeTab="products"
            inventoryActive
            actions={
                <button
                    type="button"
                    className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white hover:bg-sky-600"
                    onClick={() => setIsCreateOpen(true)}
                >
                    nowa inwentaryzacja
                </button>
            }
        >
            <h2 className="mb-3 text-[30px] leading-none text-gray-700">
                HISTORIA INWENTARYZACJI
            </h2>
            {isLoading ? (
                <p className="py-8 text-sm text-gray-500">
                    Ładowanie historii inwentaryzacji...
                </p>
            ) : (
                <div className="overflow-x-auto border border-gray-200">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 text-left text-xs uppercase text-gray-600">
                            <tr>
                                <th className="px-3 py-2">
                                    data i nazwa inwentaryzacji
                                </th>
                                <th className="px-3 py-2">liczba produktów</th>
                                <th className="px-3 py-2">
                                    liczba produktów z niedoborem w magazynie
                                </th>
                                <th className="px-3 py-2">
                                    liczba produktów z nadwyżką w magazynie
                                </th>
                                <th className="px-3 py-2">
                                    liczba produktów ze stanem zgodnym
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-t border-gray-200 hover:bg-gray-50"
                                >
                                    <td className="px-3 py-2 text-sky-600">
                                        <Link href={`/inventory/${row.id}`}>
                                            {new Date(
                                                row.stocktakingDate,
                                            ).toLocaleDateString('pl-PL')}{' '}
                                            {row.stocktakingNumber}
                                        </Link>
                                    </td>
                                    <td className="px-3 py-2">
                                        {row.productsCount}
                                    </td>
                                    <td className="px-3 py-2">
                                        {row.shortageCount}
                                    </td>
                                    <td className="px-3 py-2">
                                        {row.overageCount}
                                    </td>
                                    <td className="px-3 py-2">
                                        {row.matchedCount}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="mt-3 text-sm text-gray-500">
                Pozycje od 1 do {rows.length} | na stronie 20
            </div>

            {isCreateOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45">
                    <div className="w-full max-w-xl rounded border border-gray-300 bg-white p-4 shadow-lg">
                        <h3 className="mb-3 text-lg font-semibold">
                            Nowa inwentaryzacja
                        </h3>
                        <label className="mb-3 block text-sm">
                            <span className="mb-1 block">
                                Data inwentaryzacji
                            </span>
                            <input
                                type="date"
                                value={stocktakingDate}
                                onChange={(event) =>
                                    setStocktakingDate(event.target.value)
                                }
                                className="w-full rounded border border-gray-300 px-2 py-1.5"
                            />
                        </label>
                        <label className="mb-3 block text-sm">
                            <span className="mb-1 block">Notatki</span>
                            <textarea
                                value={notes}
                                onChange={(event) =>
                                    setNotes(event.target.value)
                                }
                                className="h-24 w-full rounded border border-gray-300 px-2 py-1.5"
                            />
                        </label>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                className="rounded border border-gray-300 px-3 py-1.5 text-sm"
                                onClick={() => setIsCreateOpen(false)}
                            >
                                anuluj
                            </button>
                            <button
                                type="button"
                                className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white"
                                onClick={() => void create()}
                            >
                                utwórz
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </WarehouseLayout>
    );
}
