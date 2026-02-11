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
                    className="btn btn-primary btn-xs"
                    onClick={() => setIsCreateOpen(true)}
                >
                    nowa inwentaryzacja
                </button>
            }
        >
            <h2 className="warehouse-section-title">HISTORIA INWENTARYZACJI</h2>
            {isLoading ? (
                <p className="products-empty">
                    Ładowanie historii inwentaryzacji...
                </p>
            ) : (
                <div className="products-table-wrap">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>data i nazwa inwentaryzacji</th>
                                <th>liczba produktów</th>
                                <th>
                                    liczba produktów z niedoborem w magazynie
                                </th>
                                <th>liczba produktów z nadwyżką w magazynie</th>
                                <th>liczba produktów ze stanem zgodnym</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <Link
                                            href={`/inventory/${row.id}`}
                                            className="products-link"
                                        >
                                            {new Date(
                                                row.stocktakingDate,
                                            ).toLocaleDateString('pl-PL')}{' '}
                                            {row.stocktakingNumber}
                                        </Link>
                                    </td>
                                    <td>{row.productsCount}</td>
                                    <td>{row.shortageCount}</td>
                                    <td>{row.overageCount}</td>
                                    <td>{row.matchedCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="products-pagination">
                Pozycje od 1 do {rows.length} | na stronie 20
            </div>

            {isCreateOpen ? (
                <div className="modal-backdrop fade in">
                    <div className="modal-dialog warehouse-modal-panel">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h4 className="modal-title">
                                    Nowa inwentaryzacja
                                </h4>
                                <button
                                    type="button"
                                    className="close"
                                    onClick={() => setIsCreateOpen(false)}
                                    aria-label="Zamknij"
                                >
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <label className="form-group">
                                    <span className="control-label">
                                        Data inwentaryzacji
                                    </span>
                                    <input
                                        type="date"
                                        value={stocktakingDate}
                                        onChange={(event) =>
                                            setStocktakingDate(
                                                event.target.value,
                                            )
                                        }
                                        className="form-control"
                                    />
                                </label>
                                <label className="form-group">
                                    <span className="control-label">
                                        Notatki
                                    </span>
                                    <textarea
                                        value={notes}
                                        onChange={(event) =>
                                            setNotes(event.target.value)
                                        }
                                        className="form-control"
                                    />
                                </label>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-default btn-xs"
                                    onClick={() => setIsCreateOpen(false)}
                                >
                                    anuluj
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-xs"
                                    onClick={() => void create()}
                                >
                                    utwórz
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </WarehouseLayout>
    );
}
