'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import WarehouseLayout from '@/components/warehouse/WarehouseLayout';
import { useCreateStocktaking } from '@/hooks/useWarehouse';

export default function InventoryNewPage() {
    const router = useRouter();
    const createMutation = useCreateStocktaking();
    const [stocktakingDate, setStocktakingDate] = useState(
        new Date().toISOString().slice(0, 10),
    );
    const [notes, setNotes] = useState('');

    const create = async () => {
        const created = await createMutation.mutateAsync({
            stocktakingDate,
            notes: notes || undefined,
        });
        await router.push(`/inventory/${created.id}`);
    };

    return (
        <WarehouseLayout
            pageTitle="Magazyn / Nowa inwentaryzacja | SalonBW"
            heading="Magazyn / Nowa inwentaryzacja"
            activeTab="products"
            inventoryActive
            actions={
                <Link href="/inventory" className="btn btn-default btn-xs">
                    wróć do historii
                </Link>
            }
        >
            <div className="warehouse-form-grid">
                <label>
                    <span>Data inwentaryzacji</span>
                    <input
                        type="date"
                        value={stocktakingDate}
                        onChange={(event) =>
                            setStocktakingDate(event.target.value)
                        }
                        className="form-control"
                    />
                </label>
                <label className="warehouse-full">
                    <span>Notatki</span>
                    <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        className="form-control"
                    />
                </label>
            </div>

            <div className="warehouse-actions-row">
                <button
                    type="button"
                    className="btn btn-primary btn-xs"
                    onClick={() => void create()}
                    disabled={createMutation.isPending}
                >
                    {createMutation.isPending
                        ? 'tworzenie...'
                        : 'utwórz inwentaryzację'}
                </button>
                <Link href="/inventory" className="btn btn-default btn-xs">
                    anuluj
                </Link>
            </div>
        </WarehouseLayout>
    );
}
