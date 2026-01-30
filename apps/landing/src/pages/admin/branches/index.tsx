'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    useBranches,
    useBranchMembers,
    useBranchesMutations,
} from '@/hooks/useBranches';
import type { Branch, BranchMember, CreateBranchRequest } from '@/types';

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
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Brak dostępu</p>
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
                await updateBranch.mutateAsync({ id: editingBranch.id, ...formData });
            } else {
                await createBranch.mutateAsync(formData);
            }
            setModalOpen(false);
        } catch (error) {
            console.error('Failed to save branch:', error);
        }
    };

    const handleDelete = async (branch: Branch) => {
        if (window.confirm(`Czy na pewno chcesz dezaktywować salon "${branch.name}"?`)) {
            try {
                await deleteBranch.mutateAsync(branch.id);
            } catch (error) {
                console.error('Failed to delete branch:', error);
            }
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
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
        inactive: 'bg-gray-100 text-gray-700',
        suspended: 'bg-red-100 text-red-700',
    };

    const STATUS_LABELS: Record<string, string> = {
        active: 'Aktywny',
        inactive: 'Nieaktywny',
        suspended: 'Zawieszony',
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Salony (Multi-location)</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Zarządzaj wieloma lokalizacjami swojego salonu
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex gap-6">
                        {[
                            { key: 'branches', label: 'Salony' },
                            { key: 'members', label: 'Pracownicy w salonach' },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key as Tab)}
                                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tab.key
                                        ? 'border-primary-500 text-primary-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                        <span className="ml-3 text-gray-600">Ładowanie...</span>
                    </div>
                ) : activeTab === 'branches' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {branches?.map((branch) => (
                            <div
                                key={branch.id}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {branch.coverImageUrl && (
                                    <div
                                        className="h-32 bg-cover bg-center"
                                        style={{ backgroundImage: `url(${branch.coverImageUrl})` }}
                                    />
                                )}
                                <div className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{branch.name}</h3>
                                            <p className="text-sm text-gray-500">{branch.city}</p>
                                        </div>
                                        <span
                                            className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[branch.status]}`}
                                        >
                                            {STATUS_LABELS[branch.status]}
                                        </span>
                                    </div>

                                    {branch.description && (
                                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                            {branch.description}
                                        </p>
                                    )}

                                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                                        {branch.phone && (
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                {branch.phone}
                                            </span>
                                        )}
                                        {branch.onlineBookingEnabled && (
                                            <span className="text-green-600">Rezerwacje online</span>
                                        )}
                                    </div>

                                    <div className="mt-4 flex items-center gap-2 border-t pt-4">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenModal(branch)}
                                            className="flex-1 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                        >
                                            Edytuj
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedBranch(branch)}
                                            className="flex-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                        >
                                            Pracownicy
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(branch)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {branches?.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <p className="font-medium">Brak salonów</p>
                                <p className="text-sm mt-1">Dodaj pierwszy salon, aby rozpocząć</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Wybierz salon
                            </label>
                            <select
                                value={selectedBranch?.id ?? ''}
                                onChange={(e) => {
                                    const branch = branches?.find((b) => b.id === parseInt(e.target.value));
                                    setSelectedBranch(branch ?? null);
                                }}
                                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                            <div className="mt-6">
                                <h3 className="font-medium text-gray-900 mb-4">
                                    Pracownicy salonu: {selectedBranch.name}
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Pracownik
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Rola
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Opcje
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {members.map((member) => (
                                                <tr key={member.id}>
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <div className="font-medium text-gray-900">
                                                                {member.user.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {member.user.email}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">
                                                        {member.branchRole}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-2">
                                                            {member.isPrimary && (
                                                                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                                                                    Główny
                                                                </span>
                                                            )}
                                                            {member.canManage && (
                                                                <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                                                                    Manager
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            type="button"
                                                            className="text-sm text-primary-600 hover:underline"
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
                            <div className="text-center py-8 text-gray-500">
                                Wybierz salon, aby zobaczyć listę pracowników
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div
                            className="fixed inset-0 bg-black/50"
                            onClick={() => setModalOpen(false)}
                        />
                        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                {editingBranch ? 'Edytuj salon' : 'Nowy salon'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nazwa salonu *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Miasto
                                        </label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city ?? ''}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Kod pocztowy
                                        </label>
                                        <input
                                            type="text"
                                            name="postalCode"
                                            value={formData.postalCode ?? ''}
                                            onChange={handleChange}
                                            placeholder="00-000"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ulica
                                        </label>
                                        <input
                                            type="text"
                                            name="street"
                                            value={formData.street ?? ''}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nr
                                        </label>
                                        <input
                                            type="text"
                                            name="buildingNumber"
                                            value={formData.buildingNumber ?? ''}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Telefon
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone ?? ''}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email ?? ''}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Opis
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description ?? ''}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setModalOpen(false)}
                                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Anuluj
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createBranch.isPending || updateBranch.isPending}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
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
