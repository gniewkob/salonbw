'use client';

import { useState } from 'react';
import {
    useDeliveries,
    useCreateDelivery,
    useReceiveDelivery,
    useCancelDelivery,
    useSuppliers,
} from '@/hooks/useWarehouse';
import type { DeliveryStatus } from '@/types';
import PanelModal from '@/components/ui/PanelModal';
import { formatPanelCurrency, formatPanelDate } from '@/utils/formatters';

const statusLabels: Record<DeliveryStatus, string> = {
    draft: 'Wersja robocza',
    pending: 'Oczekuje',
    received: 'Przyjęta',
    cancelled: 'Anulowana',
};

const statusColors: Record<DeliveryStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    received: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

export default function DeliveriesTab() {
    const [statusFilter, setStatusFilter] = useState<DeliveryStatus | ''>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        supplierId: '',
        deliveryDate: '',
        invoiceNumber: '',
        notes: '',
    });
    const [error, setError] = useState<string | null>(null);

    const { data: deliveries = [], isLoading } = useDeliveries(
        statusFilter ? { status: statusFilter } : undefined,
    );
    const { data: suppliers = [] } = useSuppliers();
    const createDelivery = useCreateDelivery();
    const receiveDelivery = useReceiveDelivery();
    const cancelDelivery = useCancelDelivery();

    const handleOpenModal = () => {
        setFormData({
            supplierId: '',
            deliveryDate: new Date().toISOString().split('T')[0],
            invoiceNumber: '',
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
            await createDelivery.mutateAsync({
                supplierId: formData.supplierId
                    ? parseInt(formData.supplierId)
                    : undefined,
                deliveryDate: formData.deliveryDate || undefined,
                invoiceNumber: formData.invoiceNumber || undefined,
                notes: formData.notes || undefined,
            });
            handleCloseModal();
        } catch (err) {
            console.error('Error creating delivery:', err);
            setError('Wystąpił błąd podczas tworzenia dostawy.');
        }
    };

    const handleReceive = async (id: number) => {
        if (
            confirm(
                'Czy na pewno chcesz przyjąć tę dostawę? Stany magazynowe zostaną zaktualizowane.',
            )
        ) {
            setError(null);
            try {
                await receiveDelivery.mutateAsync({ id });
            } catch (err) {
                console.error('Error receiving delivery:', err);
                setError('Nie udało się przyjąć dostawy. Spróbuj ponownie.');
            }
        }
    };

    const handleCancel = async (id: number) => {
        if (confirm('Czy na pewno chcesz anulować tę dostawę?')) {
            setError(null);
            try {
                await cancelDelivery.mutateAsync(id);
            } catch (err) {
                console.error('Error cancelling delivery:', err);
                setError('Nie udało się anulować dostawy. Spróbuj ponownie.');
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
                                e.target.value as DeliveryStatus | '',
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
                    + Nowa dostawa
                </button>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="text-center py-8 text-gray-500">
                    Ładowanie...
                </div>
            ) : deliveries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    Brak dostaw. Utwórz pierwszą dostawę.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nr dostawy
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Dostawca
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Data dostawy
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nr faktury
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Wartość
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
                            {deliveries.map((delivery) => (
                                <tr
                                    key={delivery.id}
                                    className="hover:bg-gray-50"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">
                                            {delivery.deliveryNumber}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {delivery.items?.length || 0}{' '}
                                            pozycji
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {delivery.supplier?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatPanelDate(delivery.deliveryDate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {delivery.invoiceNumber || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                        {formatPanelCurrency(
                                            delivery.totalCost,
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${statusColors[delivery.status]}`}
                                        >
                                            {statusLabels[delivery.status]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        {delivery.status === 'draft' && (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        void handleReceive(
                                                            delivery.id,
                                                        )
                                                    }
                                                    className="text-green-600 hover:text-green-900 mr-3"
                                                >
                                                    Przyjmij
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        void handleCancel(
                                                            delivery.id,
                                                        )
                                                    }
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Anuluj
                                                </button>
                                            </>
                                        )}
                                        {delivery.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        void handleReceive(
                                                            delivery.id,
                                                        )
                                                    }
                                                    className="text-green-600 hover:text-green-900 mr-3"
                                                >
                                                    Przyjmij
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        void handleCancel(
                                                            delivery.id,
                                                        )
                                                    }
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Anuluj
                                                </button>
                                            </>
                                        )}
                                        {delivery.status === 'received' && (
                                            <span className="text-gray-400">
                                                Przyjęta{' '}
                                                {formatPanelDate(
                                                    delivery.receivedDate,
                                                )}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <PanelModal title="Nowa dostawa">
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
                                Dostawca
                            </label>
                            <select
                                value={formData.supplierId}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        supplierId: e.target.value,
                                    })
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                            >
                                <option value="">-- Wybierz dostawcę --</option>
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Data dostawy
                            </label>
                            <input
                                type="date"
                                value={formData.deliveryDate}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        deliveryDate: e.target.value,
                                    })
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Nr faktury
                            </label>
                            <input
                                type="text"
                                value={formData.invoiceNumber}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        invoiceNumber: e.target.value,
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
                                rows={2}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                            />
                        </div>
                        <p className="text-sm text-gray-500">
                            Po utworzeniu dostawy będziesz mógł dodać produkty.
                        </p>
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
                                disabled={createDelivery.isPending}
                                className="rounded-lg bg-teal-600 px-4 py-2 text-white hover:bg-teal-700 disabled:opacity-50"
                            >
                                {createDelivery.isPending
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
