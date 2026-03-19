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
    draft: 'bg-gray-100 text-gray-800',
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
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value as StocktakingStatus | '',
                            )
                        }
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                    + Nowa inwentaryzacja
                </button>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="text-center py-8 text-gray-500">
                    Ładowanie...
                </div>
            ) : stocktakings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    Brak inwentaryzacji. Utwórz pierwszą inwentaryzację.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nr inwentaryzacji
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Data
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Utworzył
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Produktów
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Akcje
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
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
                                    <tr
                                        key={stocktaking.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">
                                                {stocktaking.stocktakingNumber}
                                            </div>
                                            {stocktaking.notes && (
                                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                                    {stocktaking.notes}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatPanelDate(
                                                stocktaking.stocktakingDate,
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {stocktaking.createdBy?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                            {stocktaking.status ===
                                            'in_progress' ? (
                                                <span>
                                                    {countedItems}/{totalItems}
                                                    {differencesCount > 0 && (
                                                        <span className="ml-1 text-orange-600">
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
                                                        <span className="ml-1 text-orange-600">
                                                            ({differencesCount}{' '}
                                                            różnic)
                                                        </span>
                                                    )}
                                                </span>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full ${statusColors[stocktaking.status]}`}
                                            >
                                                {
                                                    statusLabels[
                                                        stocktaking.status
                                                    ]
                                                }
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            {stocktaking.status === 'draft' && (
                                                <button
                                                    onClick={() =>
                                                        void handleStart(
                                                            stocktaking.id,
                                                        )
                                                    }
                                                    className="text-blue-600 hover:text-blue-900"
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
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    Zakończ
                                                </button>
                                            )}
                                            {stocktaking.status ===
                                                'completed' && (
                                                <span className="text-gray-400">
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
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                    Jak działa inwentaryzacja?
                </h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
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
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}
                    <form
                        onSubmit={(event) => {
                            void handleSubmit(event);
                        }}
                        className="space-y-4"
                    >
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
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
                                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
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
                                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                            >
                                Anuluj
                            </button>
                            <button
                                type="submit"
                                disabled={createStocktaking.isPending}
                                className="rounded-lg bg-teal-600 px-4 py-2 text-white hover:bg-teal-700 disabled:opacity-50"
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
