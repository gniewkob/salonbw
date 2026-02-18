'use client';

import { useState } from 'react';
import {
    useSuppliers,
    useCreateSupplier,
    useUpdateSupplier,
    useDeleteSupplier,
} from '@/hooks/useWarehouse';
import type { Supplier } from '@/types';

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
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSupplier(null);
        setFormData(defaultFormData);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (editingSupplier) {
            await updateSupplier.mutateAsync({
                id: editingSupplier.id,
                data: formData,
            });
        } else {
            await createSupplier.mutateAsync(formData);
        }
        handleCloseModal();
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Czy na pewno chcesz usunąć tego dostawcę?'))
            return;
        await deleteSupplier.mutateAsync(id);
    };

    return (
        <>
            <div className="products-toolbar">
                <label className="warehouse-checkbox-label">
                    <input
                        type="checkbox"
                        checked={showInactive}
                        onChange={(event) =>
                            setShowInactive(event.target.checked)
                        }
                    />
                    pokaż nieaktywnych
                </label>
                <div className="products-toolbar__actions">
                    <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={() => handleOpenModal()}
                    >
                        dodaj dostawcę
                    </button>
                </div>
            </div>

            {isLoading ? (
                <p className="products-empty">Ładowanie dostawców...</p>
            ) : suppliers.length === 0 ? (
                <p className="products-empty">
                    Brak dostawców. Dodaj pierwszego dostawcę.
                </p>
            ) : (
                <div className="products-table-wrap">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>nazwa</th>
                                <th>osoba kontaktowa</th>
                                <th>telefon</th>
                                <th>email</th>
                                <th>nip</th>
                                <th>status</th>
                                <th>akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map((supplier) => (
                                <tr key={supplier.id}>
                                    <td>{supplier.name}</td>
                                    <td>{supplier.contactPerson || '-'}</td>
                                    <td>{supplier.phone || '-'}</td>
                                    <td>{supplier.email || '-'}</td>
                                    <td>{supplier.nip || '-'}</td>
                                    <td>
                                        {supplier.isActive
                                            ? 'aktywny'
                                            : 'nieaktywny'}
                                    </td>
                                    <td className="col-actions">
                                        <button
                                            type="button"
                                            className="products-link"
                                            onClick={() =>
                                                handleOpenModal(supplier)
                                            }
                                        >
                                            edytuj
                                        </button>
                                        {' · '}
                                        <button
                                            type="button"
                                            className="products-link"
                                            onClick={() => {
                                                void handleDelete(supplier.id);
                                            }}
                                        >
                                            usuń
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="products-pagination">
                Pozycje od {suppliers.length ? 1 : 0} do {suppliers.length} z{' '}
                {suppliers.length} | na stronie 20
            </div>

            {isModalOpen ? (
                <>
                    <div className="modal fade in block bg-modal-overlay">
                        <div className="modal-dialog warehouse-modal-panel">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <button
                                        type="button"
                                        className="close"
                                        onClick={handleCloseModal}
                                        aria-label="Zamknij"
                                    >
                                        ×
                                    </button>
                                    <h4 className="modal-title">
                                        {editingSupplier
                                            ? 'Edytuj dostawcę'
                                            : 'Nowy dostawca'}
                                    </h4>
                                </div>
                                <form
                                    onSubmit={(event) =>
                                        void handleSubmit(event)
                                    }
                                >
                                    <div className="modal-body">
                                        <div className="warehouse-form-grid">
                                            <label>
                                                <span>Nazwa *</span>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(event) =>
                                                        setFormData({
                                                            ...formData,
                                                            name: event.target
                                                                .value,
                                                        })
                                                    }
                                                    required
                                                    className="form-control"
                                                />
                                            </label>
                                            <label>
                                                <span>Osoba kontaktowa</span>
                                                <input
                                                    type="text"
                                                    value={
                                                        formData.contactPerson
                                                    }
                                                    onChange={(event) =>
                                                        setFormData({
                                                            ...formData,
                                                            contactPerson:
                                                                event.target
                                                                    .value,
                                                        })
                                                    }
                                                    className="form-control"
                                                />
                                            </label>
                                            <label>
                                                <span>Email</span>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(event) =>
                                                        setFormData({
                                                            ...formData,
                                                            email: event.target
                                                                .value,
                                                        })
                                                    }
                                                    className="form-control"
                                                />
                                            </label>
                                            <label>
                                                <span>Telefon</span>
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(event) =>
                                                        setFormData({
                                                            ...formData,
                                                            phone: event.target
                                                                .value,
                                                        })
                                                    }
                                                    className="form-control"
                                                />
                                            </label>
                                            <label>
                                                <span>NIP</span>
                                                <input
                                                    type="text"
                                                    value={formData.nip}
                                                    onChange={(event) =>
                                                        setFormData({
                                                            ...formData,
                                                            nip: event.target
                                                                .value,
                                                        })
                                                    }
                                                    className="form-control"
                                                />
                                            </label>
                                            <label>
                                                <span>Status</span>
                                                <select
                                                    value={
                                                        formData.isActive
                                                            ? 'active'
                                                            : 'inactive'
                                                    }
                                                    onChange={(event) =>
                                                        setFormData({
                                                            ...formData,
                                                            isActive:
                                                                event.target
                                                                    .value ===
                                                                'active',
                                                        })
                                                    }
                                                    className="versum-select"
                                                >
                                                    <option value="active">
                                                        aktywny
                                                    </option>
                                                    <option value="inactive">
                                                        nieaktywny
                                                    </option>
                                                </select>
                                            </label>
                                            <label className="warehouse-full">
                                                <span>Adres</span>
                                                <textarea
                                                    value={formData.address}
                                                    onChange={(event) =>
                                                        setFormData({
                                                            ...formData,
                                                            address:
                                                                event.target
                                                                    .value,
                                                        })
                                                    }
                                                    className="form-control"
                                                />
                                            </label>
                                            <label className="warehouse-full">
                                                <span>Notatki</span>
                                                <textarea
                                                    value={formData.notes}
                                                    onChange={(event) =>
                                                        setFormData({
                                                            ...formData,
                                                            notes: event.target
                                                                .value,
                                                        })
                                                    }
                                                    className="form-control"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-default"
                                            onClick={handleCloseModal}
                                        >
                                            anuluj
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={
                                                createSupplier.isPending ||
                                                updateSupplier.isPending
                                            }
                                        >
                                            zapisz
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade in" />
                </>
            ) : null}
        </>
    );
}
