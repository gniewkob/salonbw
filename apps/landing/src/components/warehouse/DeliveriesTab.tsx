'use client';

import { useState } from 'react';
import {
    useDeliveries,
    useCreateDelivery,
    useReceiveDelivery,
    useCancelDelivery,
    useSuppliers,
} from '@/hooks/useWarehouse';
import type { Delivery, DeliveryStatus } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

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
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createDelivery.mutateAsync({
                supplierId: formData.supplierId ? parseInt(formData.supplierId) : undefined,
                deliveryDate: formData.deliveryDate || undefined,
                invoiceNumber: formData.invoiceNumber || undefined,
                notes: formData.notes || undefined,
            });
            handleCloseModal();
        } catch (err) {
            console.error('Error creating delivery:', err);
        }
    };

    const handleReceive = async (id: number) => {
        if (confirm('Czy na pewno chcesz przyjąć tę dostawę? Stany magazynowe zostaną zaktualizowane.')) {
            try {
                await receiveDelivery.mutateAsync({ id });
            } catch (err) {
                console.error('Error receiving delivery:', err);
            }
        }
    };

    const handleCancel = async (id: number) => {
        if (confirm('Czy na pewno chcesz anulować tę dostawę?')) {
            try {
                await cancelDelivery.mutateAsync(id);
            } catch (err) {
                console.error('Error cancelling delivery:', err);
            }
        }
    };

    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return '-';
        try {
            return format(new Date(dateStr), 'd MMM yyyy', { locale: pl });
        } catch {
            return '-';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
        }).format(amount);
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as DeliveryStatus | '')}
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
                <div className="text-center py-8 text-gray-500">Ładowanie...</div>
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
                                <tr key={delivery.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">
                                            {delivery.deliveryNumber}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {delivery.items?.length || 0} pozycji
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {delivery.supplier?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(delivery.deliveryDate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {delivery.invoiceNumber || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                        {formatCurrency(delivery.totalCost)}
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
                                                    onClick={() => handleReceive(delivery.id)}
                                                    className="text-green-600 hover:text-green-900 mr-3"
                                                >
                                                    Przyjmij
                                                </button>
                                                <button
                                                    onClick={() => handleCancel(delivery.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Anuluj
                                                </button>
                                            </>
                                        )}
                                        {delivery.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleReceive(delivery.id)}
                                                    className="text-green-600 hover:text-green-900 mr-3"
                                                >
                                                    Przyjmij
                                                </button>
                                                <button
                                                    onClick={() => handleCancel(delivery.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Anuluj
                                                </button>
                                            </>
                                        )}
                                        {delivery.status === 'received' && (
                                            <span className="text-gray-400">
                                                Przyjęta {formatDate(delivery.receivedDate)}
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold mb-4">Nowa dostawa</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Dostawca
                                    </label>
                                    <select
                                        value={formData.supplierId}
                                        onChange={(e) =>
                                            setFormData({ ...formData, supplierId: e.target.value })
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Data dostawy
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.deliveryDate}
                                        onChange={(e) =>
                                            setFormData({ ...formData, deliveryDate: e.target.value })
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nr faktury
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.invoiceNumber}
                                        onChange={(e) =>
                                            setFormData({ ...formData, invoiceNumber: e.target.value })
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notatki
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) =>
                                            setFormData({ ...formData, notes: e.target.value })
                                        }
                                        rows={2}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <p className="text-sm text-gray-500">
                                    Po utworzeniu dostawy będziesz mógł dodać produkty.
                                </p>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Anuluj
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createDelivery.isPending}
                                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                                    >
                                        {createDelivery.isPending ? 'Tworzenie...' : 'Utwórz'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
