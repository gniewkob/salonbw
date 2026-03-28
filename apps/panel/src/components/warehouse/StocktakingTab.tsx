'use client';

import { useState } from 'react';
import {
    useStocktakings,
    useCreateStocktaking,
    useStartStocktaking,
    useCompleteStocktaking,
} from '@/hooks/useWarehouse';
import type { StocktakingStatus } from '@/types';
import PanelModal from '@/components/ui/PanelModal';
import { formatPanelDate } from '@/utils/formatters';

const statusLabels: Record<StocktakingStatus, string> = {
    draft: 'Wersja robocza',
    in_progress: 'W trakcie',
    completed: 'Zakończona',
    cancelled: 'Anulowana',
};

const statusColors: Record<StocktakingStatus, string> = {
    draft: 'bg-secondary bg-opacity-10 text-dark',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

export default function StocktakingTab() {
    const [statusFilter, setStatusFilter] = useState<StocktakingStatus | ''>(
        '',
    );
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        stocktakingDate: new Date().toISOString().split('T')[0],
        notes: '',
    });
    const [error, setError] = useState<string | null>(null);

    const { data: stocktakings = [], isLoading } = useStocktakings(
        statusFilter ? { status: statusFilter } : undefined,
    );
    const createStocktaking = useCreateStocktaking();
    const startStocktaking = useStartStocktaking();
    const completeStocktaking = useCompleteStocktaking();

    const handleOpenModal = () => {
        setFormData({
            stocktakingDate: new Date().toISOString().split('T')[0],
            notes: '',
        });
        setError(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await createStocktaking.mutateAsync({
                stocktakingDate: formData.stocktakingDate || undefined,
                notes: formData.notes || undefined,
            });
            handleCloseModal();
        } catch (err) {
            console.error('Error creating stocktaking:', err);
            setError('Wystąpił błąd podczas tworzenia inwentaryzacji.');
        }
    };

    const handleStart = async (id: number) => {
        if (
            confirm(
                'Czy chcesz rozpocząć inwentaryzację? Wszystkie aktywne produkty zostaną załadowane.',
            )
        ) {
            setError(null);
            try {
                await startStocktaking.mutateAsync(id);
            } catch (err) {
                console.error('Error starting stocktaking:', err);
                setError(
                    'Nie udało się rozpocząć inwentaryzacji. Spróbuj ponownie.',
                );
            }
        }
    };

    const handleComplete = async (id: number) => {
        if (
            confirm(
                'Czy na pewno chcesz zakończyć inwentaryzację? Różnice zostaną zastosowane do stanów magazynowych.',
            )
        ) {
            setError(null);
            try {
                await completeStocktaking.mutateAsync({
                    id,
                    applyDifferences: true,
                });
            } catch (err) {
                console.error('Error completing stocktaking:', err);
                setError(
                    'Nie udało się zakończyć inwentaryzacji. Spróbuj ponownie.',
                );
            }
        }
    };

    return (
        <div>
            {error && !isModalOpen && (
                <div className="mb-3 rounded-3 border border-danger bg-danger bg-opacity-10 p-2 small text-danger">
                    {error}
                </div>
            )}
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value as StocktakingStatus | '',
                            )
                        }
                        className="border border-secondary border-opacity-50 rounded-3 px-3 py-2 small"
                    >
                        <option value="">Wszystkie statusy</option>
                        {Object.entries(statusLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={handleOpenModal}
                    className="px-3 py-2 bg-teal-600 text-white rounded-3"
                >
                    + Nowa inwentaryzacja
                </button>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="text-center py-4 text-muted">Ładowanie...</div>
            ) : stocktakings.length === 0 ? (
                <div className="text-center py-4 text-muted">
                    Brak inwentaryzacji. Utwórz pierwszą inwentaryzację.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-100">
                        <thead className="bg-light">
                            <tr>
                                <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                    Nr inwentaryzacji
                                </th>
                                <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                    Data
                                </th>
                                <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                    Utworzył
                                </th>
                                <th className="px-4 py-2 text-center small fw-medium text-muted text-uppercase">
                                    Produktów
                                </th>
                                <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                    Status
                                </th>
                                <th className="px-4 py-2 text-end small fw-medium text-muted text-uppercase">
                                    Akcje
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {stocktakings.map((stocktaking) => {
                                const countedItems =
                                    stocktaking.items?.filter(
                                        (i) => i.countedQuantity !== null,
                                    ).length || 0;
                                const totalItems =
                                    stocktaking.items?.length || 0;
                                const differencesCount =
                                    stocktaking.items?.filter(
                                        (i) =>
                                            i.difference !== 0 &&
                                            i.difference !== null,
                                    ).length || 0;

                                return (
                                    <tr key={stocktaking.id} className="">
                                        <td className="px-4 py-3 text-nowrap">
                                            <div className="fw-medium text-dark">
                                                {stocktaking.stocktakingNumber}
                                            </div>
                                            {stocktaking.notes && (
                                                <div className="small text-muted text-truncate">
                                                    {stocktaking.notes}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-nowrap small text-muted">
                                            {formatPanelDate(
                                                stocktaking.stocktakingDate,
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-nowrap small text-muted">
                                            {stocktaking.createdBy?.name || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-nowrap small text-center">
                                            {stocktaking.status ===
                                            'in_progress' ? (
                                                <span>
                                                    {countedItems}/{totalItems}
                                                    {differencesCount > 0 && (
                                                        <span className="ms-1 text-warning">
                                                            ({differencesCount}{' '}
                                                            różnic)
                                                        </span>
                                                    )}
                                                </span>
                                            ) : stocktaking.status ===
                                              'completed' ? (
                                                <span>
                                                    {totalItems}
                                                    {differencesCount > 0 && (
                                                        <span className="ms-1 text-warning">
                                                            ({differencesCount}{' '}
                                                            różnic)
                                                        </span>
                                                    )}
                                                </span>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-nowrap">
                                            <span
                                                className={`px-2 py-1 small rounded-circle ${statusColors[stocktaking.status]}`}
                                            >
                                                {
                                                    statusLabels[
                                                        stocktaking.status
                                                    ]
                                                }
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-nowrap text-end small">
                                            {stocktaking.status === 'draft' && (
                                                <button
                                                    onClick={() =>
                                                        void handleStart(
                                                            stocktaking.id,
                                                        )
                                                    }
                                                    className="text-primary"
                                                >
                                                    Rozpocznij
                                                </button>
                                            )}
                                            {stocktaking.status ===
                                                'in_progress' && (
                                                <button
                                                    onClick={() =>
                                                        void handleComplete(
                                                            stocktaking.id,
                                                        )
                                                    }
                                                    className="text-success"
                                                >
                                                    Zakończ
                                                </button>
                                            )}
                                            {stocktaking.status ===
                                                'completed' && (
                                                <span className="text-secondary">
                                                    Zakończona{' '}
                                                    {formatPanelDate(
                                                        stocktaking.completedAt,
                                                    )}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Info box */}
            <div className="mt-4 p-3 bg-primary bg-opacity-10 rounded-3">
                <h3 className="small fw-medium text-primary mb-2">
                    Jak działa inwentaryzacja?
                </h3>
                <ol className="small text-primary gap-1 list-decimal list-inside">
                    <li>Utwórz nową inwentaryzację</li>
                    <li>
                        Rozpocznij - system załaduje wszystkie produkty ze
                        stanami
                    </li>
                    <li>Wprowadź policzone ilości dla każdego produktu</li>
                    <li>Zakończ - różnice zostaną automatycznie zastosowane</li>
                </ol>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <PanelModal title="Nowa inwentaryzacja">
                    {error && (
                        <div className="mb-3 rounded-3 border border-danger bg-danger bg-opacity-10 p-2 small text-danger">
                            {error}
                        </div>
                    )}
                    <form
                        onSubmit={(event) => {
                            void handleSubmit(event);
                        }}
                        className="gap-2"
                    >
                        <div>
                            <label className="mb-1 d-block small fw-medium text-body">
                                Data inwentaryzacji
                            </label>
                            <input
                                type="date"
                                value={formData.stocktakingDate}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        stocktakingDate: e.target.value,
                                    })
                                }
                                className="w-100 rounded-3 border border-secondary border-opacity-50 px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="mb-1 d-block small fw-medium text-body">
                                Notatki
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        notes: e.target.value,
                                    })
                                }
                                rows={3}
                                placeholder="np. Inwentaryzacja kwartalna Q1 2026"
                                className="w-100 rounded-3 border border-secondary border-opacity-50 px-3 py-2"
                            />
                        </div>
                        <div className="d-flex justify-content-end gap-2 pt-3">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="rounded-3 border border-secondary border-opacity-50 px-3 py-2 text-body"
                            >
                                Anuluj
                            </button>
                            <button
                                type="submit"
                                disabled={createStocktaking.isPending}
                                className="rounded-3 bg-teal-600 px-3 py-2 text-white"
                            >
                                {createStocktaking.isPending
                                    ? 'Tworzenie...'
                                    : 'Utwórz'}
                            </button>
                        </div>
                    </form>
                </PanelModal>
            )}
        </div>
    );
}
