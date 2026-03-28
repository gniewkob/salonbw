'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    useBranches,
    useBranchMembers,
    useBranchesMutations,
} from '@/hooks/useBranches';
import type { Branch, CreateBranchRequest } from '@/types';

type Tab = 'branches' | 'members';

export default function BranchesManagementPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('branches');
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

    const { data: branches, isLoading } = useBranches();
    const { data: members } = useBranchMembers(selectedBranch?.id ?? null);
    const { createBranch, updateBranch, deleteBranch } = useBranchesMutations();

    const [formData, setFormData] = useState<CreateBranchRequest>({
        name: '',
        description: '',
        phone: '',
        email: '',
        street: '',
        buildingNumber: '',
        postalCode: '',
        city: '',
    });

    if (!user || user.role !== 'admin') {
        return (
            <div className="d-flex align-items-center justify-content-center">
                <p className="text-muted">Brak dostępu</p>
            </div>
        );
    }

    const handleOpenModal = (branch?: Branch) => {
        if (branch) {
            setEditingBranch(branch);
            setFormData({
                name: branch.name,
                slug: branch.slug,
                description: branch.description ?? '',
                phone: branch.phone ?? '',
                email: branch.email ?? '',
                street: branch.street ?? '',
                buildingNumber: branch.buildingNumber ?? '',
                postalCode: branch.postalCode ?? '',
                city: branch.city ?? '',
                primaryColor: branch.primaryColor,
                onlineBookingEnabled: branch.onlineBookingEnabled,
            });
        } else {
            setEditingBranch(null);
            setFormData({
                name: '',
                description: '',
                phone: '',
                email: '',
                street: '',
                buildingNumber: '',
                postalCode: '',
                city: '',
            });
        }
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingBranch) {
                await updateBranch.mutateAsync({
                    id: editingBranch.id,
                    ...formData,
                });
            } else {
                await createBranch.mutateAsync(formData);
            }
            setModalOpen(false);
        } catch (error) {
            console.error('Failed to save branch:', error);
        }
    };

    const handleDelete = async (branch: Branch) => {
        if (
            window.confirm(
                `Czy na pewno chcesz dezaktywować salon "${branch.name}"?`,
            )
        ) {
            try {
                await deleteBranch.mutateAsync(branch.id);
            } catch (error) {
                console.error('Failed to delete branch:', error);
            }
        }
    };

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]:
                type === 'checkbox'
                    ? (e.target as HTMLInputElement).checked
                    : value,
        }));
    };

    const STATUS_COLORS: Record<string, string> = {
        active: 'bg-green-100 text-green-700',
        inactive: 'bg-secondary bg-opacity-10 text-body',
        suspended: 'bg-red-100 text-red-700',
    };

    const STATUS_LABELS: Record<string, string> = {
        active: 'Aktywny',
        inactive: 'Nieaktywny',
        suspended: 'Zawieszony',
    };

    return (
        <div className="bg-light">
            <div className="max-w-7xl mx-auto py-4 px-3">
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <div>
                        <h1 className="fs-3 fw-bold text-dark">
                            Salony (Multi-location)
                        </h1>
                        <p className="mt-1 small text-muted">
                            Zarządzaj wieloma lokalizacjami swojego salonu
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleOpenModal()}
                        className="d-flex align-items-center gap-2 px-3 py-2 bg-primary bg-opacity-10 text-white rounded-3 fw-medium bg-opacity-10"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                        </svg>
                        Dodaj salon
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-bottom border-secondary border-opacity-25 mb-4">
                    <nav className="-mb-px d-flex gap-4">
                        {[
                            { key: 'branches', label: 'Salony' },
                            { key: 'members', label: 'Pracownicy w salonach' },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key as Tab)}
                                className={`py-2 px-1 border-bottom-2 fw-medium small ${
                                    activeTab === tab.key
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted border-opacity-50'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {isLoading ? (
                    <div className="d-flex align-items-center justify-content-center py-5">
                        <div className="rounded-circle h-6 w-6 border-bottom-2 border-primary"></div>
                        <span className="ms-2 text-muted">Ładowanie...</span>
                    </div>
                ) : activeTab === 'branches' ? (
                    <div className="-cols-1 gap-4">
                        {branches?.map((branch) => {
                            return (
                                <div
                                    key={branch.id}
                                    className="bg-white rounded-3 shadow-sm border border-secondary border-opacity-25 overflow-d-none -shadow"
                                >
                                    {branch.coverImageUrl && (
                                        <div className="h-32 overflow-d-none position-relative">
                                            <img
                                                src={branch.coverImageUrl}
                                                alt={`Okładka salonu ${branch.name}`}
                                                className="w-100 h-100 object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="p-3">
                                        <div className="d-flex align-items-start justify-content-between">
                                            <div>
                                                <h3 className="fw-semibold text-dark">
                                                    {branch.name}
                                                </h3>
                                                <p className="small text-muted">
                                                    {branch.city}
                                                </p>
                                            </div>
                                            <span
                                                className={`px-2 py-0.5 small rounded-circle ${STATUS_COLORS[branch.status]}`}
                                            >
                                                {STATUS_LABELS[branch.status]}
                                            </span>
                                        </div>

                                        {branch.description && (
                                            <p className="small text-muted mt-2 line-clamp-2">
                                                {branch.description}
                                            </p>
                                        )}

                                        <div className="mt-3 d-flex align-items-center gap-3 small text-muted">
                                            {branch.phone && (
                                                <span className="d-flex align-items-center gap-1">
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                                        />
                                                    </svg>
                                                    {branch.phone}
                                                </span>
                                            )}
                                            {branch.onlineBookingEnabled && (
                                                <span className="text-success">
                                                    Rezerwacje online
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-3 d-flex align-items-center gap-2 border-top pt-3">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleOpenModal(branch)
                                                }
                                                className="flex-fill px-3 py-2 small text-primary bg-opacity-10 rounded-3"
                                            >
                                                Edytuj
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedBranch(branch)
                                                }
                                                className="flex-fill px-3 py-2 small text-muted rounded-3"
                                            >
                                                Pracownicy
                                            </button>
                                            <button
                                                type="button"
                                                title="Usuń salon"
                                                onClick={() => {
                                                    void handleDelete(branch);
                                                }}
                                                className="p-2 text-secondary bg-opacity-10 rounded-3"
                                            >
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {branches?.length === 0 && (
                            <div className="text-center py-5 text-muted">
                                <svg
                                    className="mx-auto h-12 w-12 text-secondary mb-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                    />
                                </svg>
                                <p className="fw-medium">Brak salonów</p>
                                <p className="small mt-1">
                                    Dodaj pierwszy salon, aby rozpocząć
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-3 shadow p-4">
                        <div className="mb-3">
                            <label className="d-block small fw-medium text-body mb-1">
                                Wybierz salon
                            </label>
                            <select
                                title="Wybierz salon"
                                value={selectedBranch?.id ?? ''}
                                onChange={(e) => {
                                    const branch = branches?.find(
                                        (b) =>
                                            b.id === parseInt(e.target.value),
                                    );
                                    setSelectedBranch(branch ?? null);
                                }}
                                className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                            >
                                <option value="">Wybierz salon...</option>
                                {branches?.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedBranch && members ? (
                            <div className="mt-4">
                                <h3 className="fw-medium text-dark mb-3">
                                    Pracownicy salonu: {selectedBranch.name}
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-100">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                                                    Pracownik
                                                </th>
                                                <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                                                    Rola
                                                </th>
                                                <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                                                    Status
                                                </th>
                                                <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                                                    Opcje
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white">
                                            {members.map((member) => (
                                                <tr key={member.id}>
                                                    <td className="px-3 py-2">
                                                        <div>
                                                            <div className="fw-medium text-dark">
                                                                {
                                                                    member.user
                                                                        .name
                                                                }
                                                            </div>
                                                            <div className="small text-muted">
                                                                {
                                                                    member.user
                                                                        .email
                                                                }
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 small text-body">
                                                        {member.branchRole}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="d-flex gap-2">
                                                            {member.isPrimary && (
                                                                <span className="px-2 py-0.5 small bg-primary bg-opacity-10 text-primary rounded-circle">
                                                                    Główny
                                                                </span>
                                                            )}
                                                            {member.canManage && (
                                                                <span className="px-2 py-0.5 small bg-info bg-opacity-10 text-info rounded-circle">
                                                                    Manager
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <button
                                                            type="button"
                                                            className="small text-primary"
                                                        >
                                                            Edytuj
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4 text-muted">
                                Wybierz salon, aby zobaczyć listę pracowników
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="position-fixed top-0 start-0 bottom-0 end-0 overflow-y-auto">
                    <div className="d-flex align-items-center justify-content-center px-3">
                        <div
                            className="position-fixed top-0 start-0 bottom-0 end-0 bg-dark/50"
                            onClick={() => setModalOpen(false)}
                        />
                        <div className="position-relative bg-white rounded-3 shadow-lg w-100 p-4">
                            <h2 className="fs-5 fw-semibold text-dark mb-3">
                                {editingBranch ? 'Edytuj salon' : 'Nowy salon'}
                            </h2>

                            <form
                                onSubmit={(event) => {
                                    void handleSubmit(event);
                                }}
                                className="gap-2"
                            >
                                <div>
                                    <label className="d-block small fw-medium text-body mb-1">
                                        Nazwa salonu *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        title="Nazwa salonu"
                                        placeholder="Nazwa salonu"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                                    />
                                </div>

                                <div className="-cols-2 gap-3">
                                    <div>
                                        <label className="d-block small fw-medium text-body mb-1">
                                            Miasto
                                        </label>
                                        <input
                                            type="text"
                                            name="city"
                                            title="Miasto"
                                            placeholder="Miasto"
                                            value={formData.city ?? ''}
                                            onChange={handleChange}
                                            className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                                        />
                                    </div>
                                    <div>
                                        <label className="d-block small fw-medium text-body mb-1">
                                            Kod pocztowy
                                        </label>
                                        <input
                                            type="text"
                                            name="postalCode"
                                            title="Kod pocztowy"
                                            value={formData.postalCode ?? ''}
                                            onChange={handleChange}
                                            placeholder="00-000"
                                            className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                                        />
                                    </div>
                                </div>

                                <div className="-cols-3 gap-3">
                                    <div className="">
                                        <label className="d-block small fw-medium text-body mb-1">
                                            Ulica
                                        </label>
                                        <input
                                            type="text"
                                            name="street"
                                            title="Ulica"
                                            placeholder="Ulica"
                                            value={formData.street ?? ''}
                                            onChange={handleChange}
                                            className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                                        />
                                    </div>
                                    <div>
                                        <label className="d-block small fw-medium text-body mb-1">
                                            Nr
                                        </label>
                                        <input
                                            type="text"
                                            name="buildingNumber"
                                            title="Nr"
                                            placeholder="Nr"
                                            value={
                                                formData.buildingNumber ?? ''
                                            }
                                            onChange={handleChange}
                                            className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                                        />
                                    </div>
                                </div>

                                <div className="-cols-2 gap-3">
                                    <div>
                                        <label className="d-block small fw-medium text-body mb-1">
                                            Telefon
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            title="Telefon"
                                            placeholder="Telefon"
                                            value={formData.phone ?? ''}
                                            onChange={handleChange}
                                            className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                                        />
                                    </div>
                                    <div>
                                        <label className="d-block small fw-medium text-body mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            title="Email"
                                            placeholder="Email"
                                            value={formData.email ?? ''}
                                            onChange={handleChange}
                                            className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="d-block small fw-medium text-body mb-1">
                                        Opis
                                    </label>
                                    <textarea
                                        name="description"
                                        title="Opis"
                                        placeholder="Opis"
                                        value={formData.description ?? ''}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-3 focus:"
                                    />
                                </div>

                                <div className="d-flex justify-content-end gap-2 pt-3">
                                    <button
                                        type="button"
                                        onClick={() => setModalOpen(false)}
                                        className="px-3 py-2 text-body rounded-3"
                                    >
                                        Anuluj
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={
                                            createBranch.isPending ||
                                            updateBranch.isPending
                                        }
                                        className="px-3 py-2 bg-primary bg-opacity-10 text-white rounded-3 fw-medium bg-opacity-10"
                                    >
                                        {editingBranch ? 'Zapisz' : 'Dodaj'}
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
