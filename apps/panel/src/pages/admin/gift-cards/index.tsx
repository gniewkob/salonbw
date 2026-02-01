'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { format, addYears } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
    useGiftCards,
    useGiftCardStats,
    useGiftCardTransactions,
    useCreateGiftCard,
    useUpdateGiftCard,
    useRedeemGiftCard,
    useAdjustGiftCardBalance,
    useCancelGiftCard,
} from '@/hooks/useGiftCards';
import type {
    GiftCard,
    GiftCardStatus,
    CreateGiftCardRequest,
    UpdateGiftCardRequest,
} from '@/types';

type ModalType = 'create' | 'edit' | 'redeem' | 'adjust' | 'details' | null;

export default function GiftCardsManagementPage() {
    const { user } = useAuth();
    const [modalType, setModalType] = useState<ModalType>(null);
    const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null);
    const [statusFilter, setStatusFilter] = useState<GiftCardStatus | ''>('');
    const [searchCode, setSearchCode] = useState('');
    const [page, setPage] = useState(1);

    const { data: cardsData, isLoading } = useGiftCards({
        status: statusFilter || undefined,
        code: searchCode || undefined,
        page,
        limit: 20,
    });
    const { data: stats } = useGiftCardStats();
    const { data: transactions } = useGiftCardTransactions(
        selectedCard?.id ?? null,
    );

    const createGiftCard = useCreateGiftCard();
    const updateGiftCard = useUpdateGiftCard();
    const redeemGiftCard = useRedeemGiftCard();
    const adjustBalance = useAdjustGiftCardBalance();
    const cancelGiftCard = useCancelGiftCard();

    // Form states
    const [createForm, setCreateForm] = useState<CreateGiftCardRequest>({
        initialValue: 100,
        validFrom: format(new Date(), 'yyyy-MM-dd'),
        validUntil: format(addYears(new Date(), 1), 'yyyy-MM-dd'),
        recipientName: '',
        recipientEmail: '',
        message: '',
    });

    const [editForm, setEditForm] = useState<UpdateGiftCardRequest>({});
    const [redeemForm, setRedeemForm] = useState({
        code: '',
        amount: 0,
        notes: '',
    });
    const [adjustForm, setAdjustForm] = useState({ amount: 0, notes: '' });

    if (!user || !['admin', 'receptionist'].includes(user.role)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Brak dostępu</p>
            </div>
        );
    }

    const handleOpenCreateModal = () => {
        setCreateForm({
            initialValue: 100,
            validFrom: format(new Date(), 'yyyy-MM-dd'),
            validUntil: format(addYears(new Date(), 1), 'yyyy-MM-dd'),
            recipientName: '',
            recipientEmail: '',
            message: '',
        });
        setModalType('create');
    };

    const handleOpenEditModal = (card: GiftCard) => {
        setSelectedCard(card);
        setEditForm({
            validUntil: card.validUntil.split('T')[0],
            recipientName: card.recipientName ?? '',
            recipientEmail: card.recipientEmail ?? '',
            message: card.message ?? '',
            notes: card.notes ?? '',
        });
        setModalType('edit');
    };

    const handleOpenDetailsModal = (card: GiftCard) => {
        setSelectedCard(card);
        setModalType('details');
    };

    const handleOpenRedeemModal = () => {
        setRedeemForm({ code: '', amount: 0, notes: '' });
        setModalType('redeem');
    };

    const handleOpenAdjustModal = (card: GiftCard) => {
        setSelectedCard(card);
        setAdjustForm({ amount: 0, notes: '' });
        setModalType('adjust');
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createGiftCard.mutateAsync(createForm);
            setModalType(null);
        } catch (error) {
            console.error('Failed to create gift card:', error);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCard) return;
        try {
            await updateGiftCard.mutateAsync({
                id: selectedCard.id,
                data: editForm,
            });
            setModalType(null);
        } catch (error) {
            console.error('Failed to update gift card:', error);
        }
    };

    const handleRedeem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await redeemGiftCard.mutateAsync(redeemForm);
            setModalType(null);
        } catch (error) {
            console.error('Failed to redeem gift card:', error);
        }
    };

    const handleAdjust = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCard) return;
        try {
            await adjustBalance.mutateAsync({
                id: selectedCard.id,
                data: adjustForm,
            });
            setModalType(null);
        } catch (error) {
            console.error('Failed to adjust balance:', error);
        }
    };

    const handleCancel = async (card: GiftCard) => {
        const reason = window.prompt(
            'Podaj powód anulowania karty (opcjonalnie):',
        );
        if (reason === null) return;
        try {
            await cancelGiftCard.mutateAsync({ id: card.id, reason });
        } catch (error) {
            console.error('Failed to cancel gift card:', error);
        }
    };

    const STATUS_COLORS: Record<GiftCardStatus, string> = {
        active: 'bg-green-100 text-green-700',
        used: 'bg-gray-100 text-gray-700',
        expired: 'bg-yellow-100 text-yellow-700',
        cancelled: 'bg-red-100 text-red-700',
    };

    const STATUS_LABELS: Record<GiftCardStatus, string> = {
        active: 'Aktywna',
        used: 'Wykorzystana',
        expired: 'Wygasła',
        cancelled: 'Anulowana',
    };

    const TRANSACTION_TYPE_LABELS: Record<string, string> = {
        purchase: 'Zakup',
        redemption: 'Realizacja',
        refund: 'Zwrot',
        adjustment: 'Korekta',
        expiration: 'Wygaśnięcie',
    };

    const formatCurrency = (
        amount: number | null | undefined,
        currency = 'PLN',
    ) => {
        if (amount == null) return '-';
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Karty Podarunkowe
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Sprzedawaj i zarządzaj kartami podarunkowymi
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleOpenRedeemModal}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
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
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            Zrealizuj kartę
                        </button>
                        <button
                            type="button"
                            onClick={handleOpenCreateModal}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
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
                            Sprzedaj kartę
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <p className="text-sm text-gray-500">
                                Wszystkie karty
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats.totalCards}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <p className="text-sm text-gray-500">
                                Aktywne karty
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                                {stats.activeCards}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <p className="text-sm text-gray-500">
                                Łączna wartość
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(stats.totalValue)}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <p className="text-sm text-gray-500">
                                Wykorzystano
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                                {formatCurrency(stats.usedValue)}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <p className="text-sm text-gray-500">
                                Do wykorzystania
                            </p>
                            <p className="text-2xl font-bold text-primary-600">
                                {formatCurrency(stats.outstandingValue)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Szukaj po kodzie
                            </label>
                            <input
                                type="text"
                                value={searchCode}
                                onChange={(e) =>
                                    setSearchCode(e.target.value.toUpperCase())
                                }
                                placeholder="np. XXXX-XXXX-XXXX"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        <div className="w-48">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(
                                        e.target.value as GiftCardStatus | '',
                                    )
                                }
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">Wszystkie</option>
                                <option value="active">Aktywne</option>
                                <option value="used">Wykorzystane</option>
                                <option value="expired">Wygasłe</option>
                                <option value="cancelled">Anulowane</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Cards Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">
                            Ładowanie...
                        </div>
                    ) : cardsData?.data.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Brak kart podarunkowych
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Kod
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Wartość / Saldo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Odbiorca
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ważna do
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Akcje
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {cardsData?.data.map((card) => (
                                    <tr
                                        key={card.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleOpenDetailsModal(card)
                                                }
                                                className="font-mono text-sm text-primary-600 hover:text-primary-700 font-medium"
                                            >
                                                {card.code}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm">
                                                <span className="font-medium">
                                                    {formatCurrency(
                                                        card.currentBalance,
                                                        card.currency,
                                                    )}
                                                </span>
                                                <span className="text-gray-400">
                                                    {' '}
                                                    /{' '}
                                                    {formatCurrency(
                                                        card.initialValue,
                                                        card.currency,
                                                    )}
                                                </span>
                                            </div>
                                            {card.currentBalance <
                                                card.initialValue && (
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                                    <div
                                                        className="bg-primary-600 h-1.5 rounded-full"
                                                        style={{
                                                            width: `${(card.currentBalance / card.initialValue) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[card.status]}`}
                                            >
                                                {STATUS_LABELS[card.status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {card.recipientName ||
                                                card.recipient?.name ||
                                                '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {format(
                                                new Date(card.validUntil),
                                                'd MMM yyyy',
                                                { locale: pl },
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                {card.status === 'active' && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleOpenEditModal(
                                                                    card,
                                                                )
                                                            }
                                                            className="text-gray-600 hover:text-gray-900"
                                                            title="Edytuj"
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
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                />
                                                            </svg>
                                                        </button>
                                                        {user.role ===
                                                            'admin' && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleOpenAdjustModal(
                                                                        card,
                                                                    )
                                                                }
                                                                className="text-blue-600 hover:text-blue-900"
                                                                title="Korekta salda"
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
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        )}
                                                        {user.role ===
                                                            'admin' && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    void handleCancel(
                                                                        card,
                                                                    )
                                                                }
                                                                className="text-red-600 hover:text-red-900"
                                                                title="Anuluj"
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
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M6 18L18 6M6 6l12 12"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* Pagination */}
                    {cardsData && cardsData.total > 20 && (
                        <div className="bg-white px-4 py-3 border-t flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Strona {page} z{' '}
                                {Math.ceil(cardsData.total / 20)}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPage((p) => Math.max(1, p - 1))
                                    }
                                    disabled={page === 1}
                                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                                >
                                    Poprzednia
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={
                                        page >= Math.ceil(cardsData.total / 20)
                                    }
                                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                                >
                                    Następna
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {modalType === 'create' && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <form
                            onSubmit={(event) => {
                                void handleCreate(event);
                            }}
                        >
                            <div className="px-6 py-4 border-b">
                                <h2 className="text-lg font-semibold">
                                    Sprzedaj kartę podarunkową
                                </h2>
                            </div>
                            <div className="px-6 py-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Wartość karty (PLN) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min={1}
                                        value={createForm.initialValue}
                                        onChange={(e) =>
                                            setCreateForm((f) => ({
                                                ...f,
                                                initialValue: Number(
                                                    e.target.value,
                                                ),
                                            }))
                                        }
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ważna od *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={createForm.validFrom}
                                            onChange={(e) =>
                                                setCreateForm((f) => ({
                                                    ...f,
                                                    validFrom: e.target.value,
                                                }))
                                            }
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ważna do *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={createForm.validUntil}
                                            onChange={(e) =>
                                                setCreateForm((f) => ({
                                                    ...f,
                                                    validUntil: e.target.value,
                                                }))
                                            }
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nazwa odbiorcy
                                    </label>
                                    <input
                                        type="text"
                                        value={createForm.recipientName ?? ''}
                                        onChange={(e) =>
                                            setCreateForm((f) => ({
                                                ...f,
                                                recipientName: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email odbiorcy
                                    </label>
                                    <input
                                        type="email"
                                        value={createForm.recipientEmail ?? ''}
                                        onChange={(e) =>
                                            setCreateForm((f) => ({
                                                ...f,
                                                recipientEmail: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Wiadomość (życzenia)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={createForm.message ?? ''}
                                        onChange={(e) =>
                                            setCreateForm((f) => ({
                                                ...f,
                                                message: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="Wszystkiego najlepszego z okazji urodzin!"
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalType(null)}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    disabled={createGiftCard.isPending}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                >
                                    {createGiftCard.isPending
                                        ? 'Tworzenie...'
                                        : 'Utwórz kartę'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {modalType === 'edit' && selectedCard && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <form
                            onSubmit={(event) => {
                                void handleUpdate(event);
                            }}
                        >
                            <div className="px-6 py-4 border-b">
                                <h2 className="text-lg font-semibold">
                                    Edytuj kartę {selectedCard.code}
                                </h2>
                            </div>
                            <div className="px-6 py-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ważna do
                                    </label>
                                    <input
                                        type="date"
                                        value={editForm.validUntil ?? ''}
                                        onChange={(e) =>
                                            setEditForm((f) => ({
                                                ...f,
                                                validUntil: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nazwa odbiorcy
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.recipientName ?? ''}
                                        onChange={(e) =>
                                            setEditForm((f) => ({
                                                ...f,
                                                recipientName: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email odbiorcy
                                    </label>
                                    <input
                                        type="email"
                                        value={editForm.recipientEmail ?? ''}
                                        onChange={(e) =>
                                            setEditForm((f) => ({
                                                ...f,
                                                recipientEmail: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Wiadomość
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={editForm.message ?? ''}
                                        onChange={(e) =>
                                            setEditForm((f) => ({
                                                ...f,
                                                message: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notatki wewnętrzne
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={editForm.notes ?? ''}
                                        onChange={(e) =>
                                            setEditForm((f) => ({
                                                ...f,
                                                notes: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalType(null)}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateGiftCard.isPending}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                >
                                    {updateGiftCard.isPending
                                        ? 'Zapisywanie...'
                                        : 'Zapisz'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Redeem Modal */}
            {modalType === 'redeem' && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
                        <form
                            onSubmit={(event) => {
                                void handleRedeem(event);
                            }}
                        >
                            <div className="px-6 py-4 border-b">
                                <h2 className="text-lg font-semibold">
                                    Zrealizuj kartę podarunkową
                                </h2>
                            </div>
                            <div className="px-6 py-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kod karty *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={redeemForm.code}
                                        onChange={(e) =>
                                            setRedeemForm((f) => ({
                                                ...f,
                                                code: e.target.value.toUpperCase(),
                                            }))
                                        }
                                        placeholder="XXXX-XXXX-XXXX"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kwota do pobrania (PLN) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min={0.01}
                                        step={0.01}
                                        value={redeemForm.amount}
                                        onChange={(e) =>
                                            setRedeemForm((f) => ({
                                                ...f,
                                                amount: Number(e.target.value),
                                            }))
                                        }
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notatka
                                    </label>
                                    <input
                                        type="text"
                                        value={redeemForm.notes}
                                        onChange={(e) =>
                                            setRedeemForm((f) => ({
                                                ...f,
                                                notes: e.target.value,
                                            }))
                                        }
                                        placeholder="np. wizyta #123"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalType(null)}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    disabled={redeemGiftCard.isPending}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    {redeemGiftCard.isPending
                                        ? 'Realizowanie...'
                                        : 'Zrealizuj'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Adjust Balance Modal */}
            {modalType === 'adjust' && selectedCard && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
                        <form
                            onSubmit={(event) => {
                                void handleAdjust(event);
                            }}
                        >
                            <div className="px-6 py-4 border-b">
                                <h2 className="text-lg font-semibold">
                                    Korekta salda karty {selectedCard.code}
                                </h2>
                            </div>
                            <div className="px-6 py-4 space-y-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600">
                                        Aktualne saldo:
                                    </p>
                                    <p className="text-xl font-bold">
                                        {formatCurrency(
                                            selectedCard.currentBalance,
                                            selectedCard.currency,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kwota korekty (PLN) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        step={0.01}
                                        value={adjustForm.amount}
                                        onChange={(e) =>
                                            setAdjustForm((f) => ({
                                                ...f,
                                                amount: Number(e.target.value),
                                            }))
                                        }
                                        placeholder="Dodatnia = doładowanie, ujemna = obciążenie"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Nowe saldo:{' '}
                                        {formatCurrency(
                                            selectedCard.currentBalance +
                                                adjustForm.amount,
                                            selectedCard.currency,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Powód korekty *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={adjustForm.notes}
                                        onChange={(e) =>
                                            setAdjustForm((f) => ({
                                                ...f,
                                                notes: e.target.value,
                                            }))
                                        }
                                        placeholder="np. Zwrot za anulowaną wizytę"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalType(null)}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    disabled={adjustBalance.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {adjustBalance.isPending
                                        ? 'Zapisywanie...'
                                        : 'Zastosuj korektę'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {modalType === 'details' && selectedCard && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-semibold">
                                Szczegóły karty {selectedCard.code}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setModalType(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="px-6 py-4">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Kod karty
                                    </p>
                                    <p className="font-mono text-lg font-bold">
                                        {selectedCard.code}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Status
                                    </p>
                                    <span
                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[selectedCard.status]}`}
                                    >
                                        {STATUS_LABELS[selectedCard.status]}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Wartość początkowa
                                    </p>
                                    <p className="font-medium">
                                        {formatCurrency(
                                            selectedCard.initialValue,
                                            selectedCard.currency,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Aktualne saldo
                                    </p>
                                    <p className="font-medium text-primary-600">
                                        {formatCurrency(
                                            selectedCard.currentBalance,
                                            selectedCard.currency,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Ważna od
                                    </p>
                                    <p className="font-medium">
                                        {format(
                                            new Date(selectedCard.validFrom),
                                            'd MMM yyyy',
                                            { locale: pl },
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Ważna do
                                    </p>
                                    <p className="font-medium">
                                        {format(
                                            new Date(selectedCard.validUntil),
                                            'd MMM yyyy',
                                            { locale: pl },
                                        )}
                                    </p>
                                </div>
                                {selectedCard.recipientName && (
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Odbiorca
                                        </p>
                                        <p className="font-medium">
                                            {selectedCard.recipientName}
                                        </p>
                                    </div>
                                )}
                                {selectedCard.recipientEmail && (
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Email odbiorcy
                                        </p>
                                        <p className="font-medium">
                                            {selectedCard.recipientEmail}
                                        </p>
                                    </div>
                                )}
                                {selectedCard.message && (
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-500">
                                            Wiadomość
                                        </p>
                                        <p className="font-medium italic">
                                            &quot;{selectedCard.message}&quot;
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Sprzedawca
                                    </p>
                                    <p className="font-medium">
                                        {selectedCard.soldBy?.name ?? '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Data sprzedaży
                                    </p>
                                    <p className="font-medium">
                                        {selectedCard.soldAt
                                            ? format(
                                                  new Date(selectedCard.soldAt),
                                                  'd MMM yyyy HH:mm',
                                                  { locale: pl },
                                              )
                                            : '-'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-3">
                                    Historia transakcji
                                </h3>
                                {transactions?.length === 0 ? (
                                    <p className="text-gray-500 text-sm">
                                        Brak transakcji
                                    </p>
                                ) : (
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Data
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Typ
                                                    </th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                                        Kwota
                                                    </th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                                        Saldo
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Wykonawca
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {transactions?.map((tx) => (
                                                    <tr key={tx.id}>
                                                        <td className="px-4 py-2 text-sm">
                                                            {format(
                                                                new Date(
                                                                    tx.createdAt,
                                                                ),
                                                                'd MMM HH:mm',
                                                                { locale: pl },
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm">
                                                            {
                                                                TRANSACTION_TYPE_LABELS[
                                                                    tx.type
                                                                ]
                                                            }
                                                        </td>
                                                        <td
                                                            className={`px-4 py-2 text-sm text-right font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                                        >
                                                            {tx.amount >= 0
                                                                ? '+'
                                                                : ''}
                                                            {formatCurrency(
                                                                tx.amount,
                                                                selectedCard.currency,
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-right">
                                                            {formatCurrency(
                                                                tx.balanceAfter,
                                                                selectedCard.currency,
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm">
                                                            {tx.performedBy
                                                                ?.name ?? '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
