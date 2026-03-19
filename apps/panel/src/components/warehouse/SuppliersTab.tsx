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
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                    {error}
                </div>
            )}
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                            className="rounded border-gray-300"
                        />
                        Pokaż nieaktywnych
                    </label>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                    + Dodaj dostawcę
                </button>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="text-center py-8 text-gray-500">
                    Ładowanie...
                </div>
            ) : suppliers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    Brak dostawców. Dodaj pierwszego dostawcę.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nazwa
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Kontakt
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Telefon
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    NIP
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
                            {suppliers.map((supplier) => (
                                <tr
                                    key={supplier.id}
                                    className="hover:bg-gray-50"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">
                                            {supplier.name}
                                        </div>
                                        {supplier.email && (
                                            <div className="text-sm text-gray-500">
                                                {supplier.email}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {supplier.contactPerson || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {supplier.phone || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {supplier.nip || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${
                                                supplier.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            {supplier.isActive
                                                ? 'Aktywny'
                                                : 'Nieaktywny'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <button
                                            onClick={() =>
                                                handleOpenModal(supplier)
                                            }
                                            className="text-teal-600 hover:text-teal-900 mr-3"
                                        >
                                            Edytuj
                                        </button>
                                        <button
                                            onClick={() => {
                                                void handleDelete(supplier.id);
                                            }}
                                            className="text-red-600 hover:text-red-900"
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                    setFormData({
                                        ...formData,
                                        notes: e.target.value,
                                    })
                                }
                                rows={2}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            isActive: e.target.checked,
                                        })
                                    }
                                    className="rounded border-gray-300"
                                />
                                <span className="text-sm text-gray-700">
                                    Aktywny
                                </span>
                            </label>
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
                                disabled={
                                    createSupplier.isPending ||
                                    updateSupplier.isPending
                                }
                                className="rounded-lg bg-teal-600 px-4 py-2 text-white hover:bg-teal-700 disabled:opacity-50"
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
