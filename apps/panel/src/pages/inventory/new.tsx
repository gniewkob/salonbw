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
            <h3 className="warehouse-subtitle">Nowa inwentaryzacja</h3>
            <div className="warehouse-entry-form warehouse-new-screen">
                <div className="warehouse-entry-row">
                    <span className="warehouse-entry-row__index">1.</span>
                    <span className="warehouse-entry-row__label">
                        data inwentaryzacji
                    </span>
                    <input
                        type="date"
                        value={stocktakingDate}
                        onChange={(event) =>
                            setStocktakingDate(event.target.value)
                        }
                        className="form-control"
                    />
                </div>
                <div className="warehouse-entry-row">
                    <span className="warehouse-entry-row__index">2.</span>
                    <span className="warehouse-entry-row__label">opis</span>
                    <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        className="form-control"
                    />
                </div>
            </div>

            <div className="warehouse-entry-actions warehouse-new-screen">
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
