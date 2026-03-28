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
    draft: 'bg-secondary bg-opacity-10 text-dark',
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
                                e.target.value as DeliveryStatus | '',
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
                    + Nowa dostawa
                </button>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="text-center py-4 text-muted">Ładowanie...</div>
            ) : deliveries.length === 0 ? (
                <div className="text-center py-4 text-muted">
                    Brak dostaw. Utwórz pierwszą dostawę.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-100">
                        <thead className="bg-light">
                            <tr>
                                <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                    Nr dostawy
                                </th>
                                <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                    Dostawca
                                </th>
                                <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                    Data dostawy
                                </th>
                                <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                    Nr faktury
                                </th>
                                <th className="px-4 py-2 text-end small fw-medium text-muted text-uppercase">
                                    Wartość
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
                            {deliveries.map((delivery) => (
                                <tr key={delivery.id} className="">
                                    <td className="px-4 py-3 text-nowrap">
                                        <div className="fw-medium text-dark">
                                            {delivery.deliveryNumber}
                                        </div>
                                        <div className="small text-muted">
                                            {delivery.items?.length || 0}{' '}
                                            pozycji
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-nowrap small text-muted">
                                        {delivery.supplier?.name || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-nowrap small text-muted">
                                        {formatPanelDate(delivery.deliveryDate)}
                                    </td>
                                    <td className="px-4 py-3 text-nowrap small text-muted">
                                        {delivery.invoiceNumber || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-nowrap small text-dark text-end">
                                        {formatPanelCurrency(
                                            delivery.totalCost,
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-nowrap">
                                        <span
                                            className={`px-2 py-1 small rounded-circle ${statusColors[delivery.status]}`}
                                        >
                                            {statusLabels[delivery.status]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-nowrap text-end small">
                                        {delivery.status === 'draft' && (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        void handleReceive(
                                                            delivery.id,
                                                        )
                                                    }
                                                    className="text-success me-2"
                                                >
                                                    Przyjmij
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        void handleCancel(
                                                            delivery.id,
                                                        )
                                                    }
                                                    className="text-danger"
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
                                                    className="text-success me-2"
                                                >
                                                    Przyjmij
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        void handleCancel(
                                                            delivery.id,
                                                        )
                                                    }
                                                    className="text-danger"
                                                >
                                                    Anuluj
                                                </button>
                                            </>
                                        )}
                                        {delivery.status === 'received' && (
                                            <span className="text-secondary">
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
                                className="w-100 rounded-3 border border-secondary border-opacity-50 px-3 py-2"
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
                            <label className="mb-1 d-block small fw-medium text-body">
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
                                className="w-100 rounded-3 border border-secondary border-opacity-50 px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="mb-1 d-block small fw-medium text-body">
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
                                rows={2}
                                className="w-100 rounded-3 border border-secondary border-opacity-50 px-3 py-2"
                            />
                        </div>
                        <p className="small text-muted">
                            Po utworzeniu dostawy będziesz mógł dodać produkty.
                        </p>
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
                                disabled={createDelivery.isPending}
                                className="rounded-3 bg-teal-600 px-3 py-2 text-white"
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
