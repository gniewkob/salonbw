'use client';

import { useState } from 'react';
import {
    useSuppliers,
    useCreateSupplier,
    useUpdateSupplier,
    useDeleteSupplier,
} from '@/hooks/useWarehouse';
import type { Supplier } from '@/types';
import PanelModal from '@/components/ui/PanelModal';

interface SupplierFormData {
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    nip: string;
    notes: string;
    isActive: boolean;
}

const defaultFormData: SupplierFormData = {
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    nip: '',
    notes: '',
    isActive: true,
};

export default function SuppliersTab() {
    const [showInactive, setShowInactive] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(
        null,
    );
    const [formData, setFormData] = useState<SupplierFormData>(defaultFormData);
    const [error, setError] = useState<string | null>(null);

    const { data: suppliers = [], isLoading } = useSuppliers(showInactive);
    const createSupplier = useCreateSupplier();
    const updateSupplier = useUpdateSupplier();
    const deleteSupplier = useDeleteSupplier();

    const handleOpenModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                name: supplier.name,
                contactPerson: supplier.contactPerson || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                address: supplier.address || '',
                nip: supplier.nip || '',
                notes: supplier.notes || '',
                isActive: supplier.isActive,
            });
        } else {
            setEditingSupplier(null);
            setFormData(defaultFormData);
        }
        setError(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSupplier(null);
        setFormData(defaultFormData);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            if (editingSupplier) {
                await updateSupplier.mutateAsync({
                    id: editingSupplier.id,
                    data: formData,
                });
            } else {
                await createSupplier.mutateAsync(formData);
            }
            handleCloseModal();
        } catch (err) {
            console.error('Error saving supplier:', err);
            setError(
                'Wystąpił błąd podczas zapisywania dostawcy. Spróbuj ponownie.',
            );
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Czy na pewno chcesz usunąć tego dostawcę?')) {
            setError(null);
            try {
                await deleteSupplier.mutateAsync(id);
            } catch (err) {
                console.error('Error deleting supplier:', err);
                setError(
                    'Nie udało się usunąć dostawcy. Upewnij się, że nie ma przypisanych dostaw.',
                );
            }
        }
    };

    return (
        <div>
            {error && !isModalOpen && (
                <div className="mb-3 p-2 bg-danger bg-opacity-10 text-danger small rounded-3 border border-danger">
                    {error}
                </div>
            )}
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-3">
                    <label className="d-flex align-items-center gap-2 small text-muted">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                            className="rounded border-secondary border-opacity-50"
                        />
                        Pokaż nieaktywnych
                    </label>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-3 py-2 bg-teal-600 text-white rounded-3"
                >
                    + Dodaj dostawcę
                </button>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="text-center py-4 text-muted">Ładowanie...</div>
            ) : suppliers.length === 0 ? (
                <div className="text-center py-4 text-muted">
                    Brak dostawców. Dodaj pierwszego dostawcę.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-100">
                        <thead className="bg-light">
                            <tr>
                                <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                    Nazwa
                                </th>
                                <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                    Kontakt
                                </th>
                                <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                    Telefon
                                </th>
                                <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                    NIP
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
                            {suppliers.map((supplier) => (
                                <tr key={supplier.id} className="">
                                    <td className="px-4 py-3 text-nowrap">
                                        <div className="fw-medium text-dark">
                                            {supplier.name}
                                        </div>
                                        {supplier.email && (
                                            <div className="small text-muted">
                                                {supplier.email}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-nowrap small text-muted">
                                        {supplier.contactPerson || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-nowrap small text-muted">
                                        {supplier.phone || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-nowrap small text-muted">
                                        {supplier.nip || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-nowrap">
                                        <span
                                            className={`px-2 py-1 small rounded-circle ${
                                                supplier.isActive
                                                    ? 'bg-success bg-opacity-10 text-success'
                                                    : 'bg-light text-dark'
                                            }`}
                                        >
                                            {supplier.isActive
                                                ? 'Aktywny'
                                                : 'Nieaktywny'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-nowrap text-end small">
                                        <button
                                            onClick={() =>
                                                handleOpenModal(supplier)
                                            }
                                            className="text-teal-600 me-2"
                                        >
                                            Edytuj
                                        </button>
                                        <button
                                            onClick={() => {
                                                void handleDelete(supplier.id);
                                            }}
                                            className="text-danger"
                                        >
                                            Usuń
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <PanelModal
                    title={
                        editingSupplier ? 'Edytuj dostawcę' : 'Nowy dostawca'
                    }
                    maxWidthClassName="max-w-md max-h-[90vh] overflow-y-auto"
                >
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
                            <label className="d-block small fw-medium text-body mb-1">
                                Nazwa *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
                                required
                                className="w-100 border border-secondary border-opacity-50 rounded-3 px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="d-block small fw-medium text-body mb-1">
                                Osoba kontaktowa
                            </label>
                            <input
                                type="text"
                                value={formData.contactPerson}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        contactPerson: e.target.value,
                                    })
                                }
                                className="w-100 border border-secondary border-opacity-50 rounded-3 px-3 py-2"
                            />
                        </div>
                        <div className="-cols-2 gap-3">
                            <div>
                                <label className="d-block small fw-medium text-body mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            email: e.target.value,
                                        })
                                    }
                                    className="w-100 border border-secondary border-opacity-50 rounded-3 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="d-block small fw-medium text-body mb-1">
                                    Telefon
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            phone: e.target.value,
                                        })
                                    }
                                    className="w-100 border border-secondary border-opacity-50 rounded-3 px-3 py-2"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="d-block small fw-medium text-body mb-1">
                                NIP
                            </label>
                            <input
                                type="text"
                                value={formData.nip}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        nip: e.target.value,
                                    })
                                }
                                className="w-100 border border-secondary border-opacity-50 rounded-3 px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="d-block small fw-medium text-body mb-1">
                                Adres
                            </label>
                            <textarea
                                value={formData.address}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        address: e.target.value,
                                    })
                                }
                                rows={2}
                                className="w-100 border border-secondary border-opacity-50 rounded-3 px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="d-block small fw-medium text-body mb-1">
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
                                className="w-100 border border-secondary border-opacity-50 rounded-3 px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="d-flex align-items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            isActive: e.target.checked,
                                        })
                                    }
                                    className="rounded border-secondary border-opacity-50"
                                />
                                <span className="small text-body">Aktywny</span>
                            </label>
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
                                disabled={
                                    createSupplier.isPending ||
                                    updateSupplier.isPending
                                }
                                className="rounded-3 bg-teal-600 px-3 py-2 text-white"
                            >
                                {createSupplier.isPending ||
                                updateSupplier.isPending
                                    ? 'Zapisywanie...'
                                    : 'Zapisz'}
                            </button>
                        </div>
                    </form>
                </PanelModal>
            )}
        </div>
    );
}
