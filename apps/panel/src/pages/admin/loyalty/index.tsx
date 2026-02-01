'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
    useLoyaltyProgram,
    useLoyaltyStats,
    useLoyaltyRewards,
    useLoyaltyTransactions,
    useUpdateLoyaltyProgram,
    useCreateReward,
    useUpdateReward,
    useDeleteReward,
    useUseCoupon,
} from '@/hooks/useLoyalty';
import type {
    LoyaltyReward,
    RewardType,
    CreateRewardRequest,
    UpdateRewardRequest,
    UpdateLoyaltyProgramRequest,
} from '@/types';

type Tab = 'overview' | 'rewards' | 'transactions' | 'settings';
type ModalType = 'createReward' | 'editReward' | 'useCoupon' | null;

const REWARD_TYPE_LABELS: Record<RewardType, string> = {
    discount: 'Rabat',
    free_service: 'Darmowa usługa',
    free_product: 'Darmowy produkt',
    gift_card: 'Karta podarunkowa',
    custom: 'Inna',
};

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
    earn: 'Naliczenie',
    spend: 'Wydanie',
    expire: 'Wygaśnięcie',
    adjust: 'Korekta',
    bonus: 'Bonus',
    referral: 'Polecenie',
};

const SOURCE_LABELS: Record<string, string> = {
    appointment: 'Wizyta',
    product_purchase: 'Zakup produktu',
    reward: 'Nagroda',
    birthday: 'Urodziny',
    referral: 'Polecenie',
    signup: 'Rejestracja',
    manual: 'Ręczna',
    expiration: 'Wygaśnięcie',
};

export default function LoyaltyManagementPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [modalType, setModalType] = useState<ModalType>(null);
    const [selectedReward, setSelectedReward] = useState<LoyaltyReward | null>(
        null,
    );
    const [page, setPage] = useState(1);

    const { data: program } = useLoyaltyProgram();
    const { data: stats } = useLoyaltyStats();
    const { data: rewardsData, isLoading: rewardsLoading } = useLoyaltyRewards({
        page,
        limit: 20,
    });
    const { data: transactionsData, isLoading: transactionsLoading } =
        useLoyaltyTransactions({ page, limit: 20 });

    const updateProgram = useUpdateLoyaltyProgram();
    const createReward = useCreateReward();
    const updateReward = useUpdateReward();
    const deleteReward = useDeleteReward();
    const useCoupon = useUseCoupon();

    // Form states
    const [rewardForm, setRewardForm] = useState<CreateRewardRequest>({
        name: '',
        type: 'discount',
        pointsCost: 100,
    });
    const [couponCode, setCouponCode] = useState('');
    const [programForm, setProgramForm] = useState<UpdateLoyaltyProgramRequest>(
        {},
    );

    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Brak dostępu</p>
            </div>
        );
    }

    const handleOpenCreateReward = () => {
        setSelectedReward(null);
        setRewardForm({
            name: '',
            type: 'discount',
            pointsCost: 100,
        });
        setModalType('createReward');
    };

    const handleOpenEditReward = (reward: LoyaltyReward) => {
        setSelectedReward(reward);
        setRewardForm({
            name: reward.name,
            description: reward.description ?? '',
            type: reward.type,
            pointsCost: reward.pointsCost,
            discountPercent: reward.discountPercent ?? undefined,
            discountAmount: reward.discountAmount ?? undefined,
            serviceId: reward.serviceId ?? undefined,
            productId: reward.productId ?? undefined,
            giftCardValue: reward.giftCardValue ?? undefined,
        });
        setModalType('editReward');
    };

    const handleSaveReward = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedReward) {
                await updateReward.mutateAsync({
                    id: selectedReward.id,
                    data: rewardForm as UpdateRewardRequest,
                });
            } else {
                await createReward.mutateAsync(rewardForm);
            }
            setModalType(null);
        } catch (error) {
            console.error('Failed to save reward:', error);
        }
    };

    const handleDeleteReward = async (reward: LoyaltyReward) => {
        if (
            window.confirm(
                `Czy na pewno chcesz usunąć nagrodę "${reward.name}"?`,
            )
        ) {
            try {
                await deleteReward.mutateAsync(reward.id);
            } catch (error) {
                console.error('Failed to delete reward:', error);
            }
        }
    };

    const handleUseCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await useCoupon.mutateAsync({ redemptionCode: couponCode });
            setModalType(null);
            setCouponCode('');
            alert('Kupon został zrealizowany!');
        } catch (error) {
            console.error('Failed to use coupon:', error);
        }
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateProgram.mutateAsync(programForm);
            alert('Ustawienia zapisane!');
        } catch (error) {
            console.error('Failed to update settings:', error);
        }
    };

    const formatCurrency = (amount: number | null | undefined) => {
        if (amount == null) return '-';
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
        }).format(amount);
    };

    const TABS: { id: Tab; label: string }[] = [
        { id: 'overview', label: 'Przegląd' },
        { id: 'rewards', label: 'Nagrody' },
        { id: 'transactions', label: 'Transakcje' },
        { id: 'settings', label: 'Ustawienia' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Program Lojalnościowy
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Zarządzaj punktami i nagrodami dla klientów
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setModalType('useCoupon')}
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
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        Zrealizuj kupon
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-primary-500 text-primary-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        {stats && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-white rounded-xl shadow-sm p-6">
                                    <p className="text-sm text-gray-500">
                                        Członkowie programu
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {stats.totalMembers}
                                    </p>
                                    <p className="text-sm text-green-600">
                                        {stats.activeMembers} aktywnych
                                    </p>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm p-6">
                                    <p className="text-sm text-gray-500">
                                        Wydane punkty
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {stats.totalPointsIssued.toLocaleString(
                                            'pl-PL',
                                        )}
                                    </p>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm p-6">
                                    <p className="text-sm text-gray-500">
                                        Wykorzystane punkty
                                    </p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {stats.totalPointsRedeemed.toLocaleString(
                                            'pl-PL',
                                        )}
                                    </p>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm p-6">
                                    <p className="text-sm text-gray-500">
                                        Zaległe zobowiązanie
                                    </p>
                                    <p className="text-2xl font-bold text-primary-600">
                                        {formatCurrency(stats.outstandingValue)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {stats.outstandingPoints.toLocaleString(
                                            'pl-PL',
                                        )}{' '}
                                        pkt
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Program Info */}
                        {program && (
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-lg font-semibold mb-4">
                                    Zasady programu
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Punkty za 1 PLN
                                        </p>
                                        <p className="font-medium">
                                            {program.pointsPerCurrency} pkt
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Wartość 1 punktu
                                        </p>
                                        <p className="font-medium">
                                            {(
                                                Number(
                                                    program.pointsValueCurrency,
                                                ) * 100
                                            ).toFixed(0)}{' '}
                                            gr
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Min. do wymiany
                                        </p>
                                        <p className="font-medium">
                                            {program.minPointsRedemption} pkt
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Wygasanie punktów
                                        </p>
                                        <p className="font-medium">
                                            {program.pointsExpireMonths
                                                ? `${program.pointsExpireMonths} mies.`
                                                : 'Nie wygasają'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick Stats */}
                        {stats && (
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-lg font-semibold mb-4">
                                    Nagrody
                                </h2>
                                <p className="text-gray-600">
                                    Zrealizowano{' '}
                                    <span className="font-bold">
                                        {stats.totalRewardsRedeemed}
                                    </span>{' '}
                                    nagród
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Rewards Tab */}
                {activeTab === 'rewards' && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <button
                                type="button"
                                onClick={handleOpenCreateReward}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
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
                                Dodaj nagrodę
                            </button>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            {rewardsLoading ? (
                                <div className="p-8 text-center text-gray-500">
                                    Ładowanie...
                                </div>
                            ) : rewardsData?.data.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    Brak nagród w katalogu
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Nazwa
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Typ
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Koszt
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Realizacje
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                Akcje
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {rewardsData?.data.map((reward) => (
                                            <tr
                                                key={reward.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {reward.name}
                                                        </p>
                                                        {reward.description && (
                                                            <p className="text-sm text-gray-500">
                                                                {
                                                                    reward.description
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    {
                                                        REWARD_TYPE_LABELS[
                                                            reward.type
                                                        ]
                                                    }
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    {reward.pointsCost} pkt
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    {reward.currentRedemptions}
                                                    {reward.maxRedemptions &&
                                                        ` / ${reward.maxRedemptions}`}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            reward.isActive
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                        }`}
                                                    >
                                                        {reward.isActive
                                                            ? 'Aktywna'
                                                            : 'Nieaktywna'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleOpenEditReward(
                                                                    reward,
                                                                )
                                                            }
                                                            className="text-gray-600 hover:text-gray-900"
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
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void handleDeleteReward(
                                                                    reward,
                                                                )
                                                            }
                                                            className="text-red-600 hover:text-red-900"
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
                                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* Transactions Tab */}
                {activeTab === 'transactions' && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        {transactionsLoading ? (
                            <div className="p-8 text-center text-gray-500">
                                Ładowanie...
                            </div>
                        ) : transactionsData?.data.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                Brak transakcji
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Data
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Klient
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Typ
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Źródło
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            Punkty
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            Saldo
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {transactionsData?.data.map((tx) => (
                                        <tr
                                            key={tx.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 text-sm">
                                                {format(
                                                    new Date(tx.createdAt),
                                                    'd MMM yyyy HH:mm',
                                                    { locale: pl },
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {tx.user?.name ?? '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {
                                                    TRANSACTION_TYPE_LABELS[
                                                        tx.type
                                                    ]
                                                }
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {SOURCE_LABELS[tx.source]}
                                            </td>
                                            <td
                                                className={`px-6 py-4 text-sm text-right font-medium ${tx.points >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                            >
                                                {tx.points >= 0 ? '+' : ''}
                                                {tx.points}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right">
                                                {tx.balanceAfter}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {transactionsData && transactionsData.total > 20 && (
                            <div className="px-4 py-3 border-t flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Strona {page} z{' '}
                                    {Math.ceil(transactionsData.total / 20)}
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
                                            page >=
                                            Math.ceil(
                                                transactionsData.total / 20,
                                            )
                                        }
                                        className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                                    >
                                        Następna
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && program && (
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold mb-6">
                            Ustawienia programu
                        </h2>
                        <form
                            onSubmit={(event) => {
                                void handleUpdateSettings(event);
                            }}
                            className="space-y-6 max-w-2xl"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Punkty za 1 PLN wydany
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={0.1}
                                        defaultValue={program.pointsPerCurrency}
                                        onChange={(e) =>
                                            setProgramForm((f) => ({
                                                ...f,
                                                pointsPerCurrency: Number(
                                                    e.target.value,
                                                ),
                                            }))
                                        }
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Wartość 1 punktu (PLN)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={0.001}
                                        defaultValue={
                                            program.pointsValueCurrency
                                        }
                                        onChange={(e) =>
                                            setProgramForm((f) => ({
                                                ...f,
                                                pointsValueCurrency: Number(
                                                    e.target.value,
                                                ),
                                            }))
                                        }
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Min. punktów do wymiany
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        defaultValue={
                                            program.minPointsRedemption
                                        }
                                        onChange={(e) =>
                                            setProgramForm((f) => ({
                                                ...f,
                                                minPointsRedemption: Number(
                                                    e.target.value,
                                                ),
                                            }))
                                        }
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Wygasanie punktów (miesiące)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        defaultValue={
                                            program.pointsExpireMonths ?? ''
                                        }
                                        placeholder="0 = nie wygasają"
                                        onChange={(e) =>
                                            setProgramForm((f) => ({
                                                ...f,
                                                pointsExpireMonths: e.target
                                                    .value
                                                    ? Number(e.target.value)
                                                    : undefined,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-medium mb-3">Bonusy</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Za rejestrację
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            defaultValue={
                                                program.signupBonusPoints
                                            }
                                            onChange={(e) =>
                                                setProgramForm((f) => ({
                                                    ...f,
                                                    signupBonusPoints: Number(
                                                        e.target.value,
                                                    ),
                                                }))
                                            }
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Za polecenie
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            defaultValue={
                                                program.referralBonusPoints
                                            }
                                            onChange={(e) =>
                                                setProgramForm((f) => ({
                                                    ...f,
                                                    referralBonusPoints: Number(
                                                        e.target.value,
                                                    ),
                                                }))
                                            }
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Urodzinowy
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            defaultValue={
                                                program.birthdayBonusPoints
                                            }
                                            onChange={(e) =>
                                                setProgramForm((f) => ({
                                                    ...f,
                                                    birthdayBonusPoints: Number(
                                                        e.target.value,
                                                    ),
                                                }))
                                            }
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={updateProgram.isPending}
                                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                >
                                    {updateProgram.isPending
                                        ? 'Zapisywanie...'
                                        : 'Zapisz ustawienia'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Create/Edit Reward Modal */}
            {(modalType === 'createReward' || modalType === 'editReward') && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <form
                            onSubmit={(event) => {
                                void handleSaveReward(event);
                            }}
                        >
                            <div className="px-6 py-4 border-b">
                                <h2 className="text-lg font-semibold">
                                    {selectedReward
                                        ? 'Edytuj nagrodę'
                                        : 'Dodaj nagrodę'}
                                </h2>
                            </div>
                            <div className="px-6 py-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nazwa *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={rewardForm.name}
                                        onChange={(e) =>
                                            setRewardForm((f) => ({
                                                ...f,
                                                name: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Opis
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={rewardForm.description ?? ''}
                                        onChange={(e) =>
                                            setRewardForm((f) => ({
                                                ...f,
                                                description: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Typ *
                                        </label>
                                        <select
                                            value={rewardForm.type}
                                            onChange={(e) =>
                                                setRewardForm((f) => ({
                                                    ...f,
                                                    type: e.target
                                                        .value as RewardType,
                                                }))
                                            }
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                            {Object.entries(
                                                REWARD_TYPE_LABELS,
                                            ).map(([value, label]) => (
                                                <option
                                                    key={value}
                                                    value={value}
                                                >
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Koszt (punkty) *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min={1}
                                            value={rewardForm.pointsCost}
                                            onChange={(e) =>
                                                setRewardForm((f) => ({
                                                    ...f,
                                                    pointsCost: Number(
                                                        e.target.value,
                                                    ),
                                                }))
                                            }
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                                {rewardForm.type === 'discount' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Rabat %
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={100}
                                                value={
                                                    rewardForm.discountPercent ??
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    setRewardForm((f) => ({
                                                        ...f,
                                                        discountPercent: e
                                                            .target.value
                                                            ? Number(
                                                                  e.target
                                                                      .value,
                                                              )
                                                            : undefined,
                                                    }))
                                                }
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                lub Kwota (PLN)
                                            </label>
                                            <input
                                                type="number"
                                                min={0}
                                                step={0.01}
                                                value={
                                                    rewardForm.discountAmount ??
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    setRewardForm((f) => ({
                                                        ...f,
                                                        discountAmount: e.target
                                                            .value
                                                            ? Number(
                                                                  e.target
                                                                      .value,
                                                              )
                                                            : undefined,
                                                    }))
                                                }
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>
                                )}
                                {rewardForm.type === 'gift_card' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Wartość karty (PLN)
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            value={
                                                rewardForm.giftCardValue ?? ''
                                            }
                                            onChange={(e) =>
                                                setRewardForm((f) => ({
                                                    ...f,
                                                    giftCardValue: e.target
                                                        .value
                                                        ? Number(e.target.value)
                                                        : undefined,
                                                }))
                                            }
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Max. realizacji (opcjonalnie)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={rewardForm.maxRedemptions ?? ''}
                                        onChange={(e) =>
                                            setRewardForm((f) => ({
                                                ...f,
                                                maxRedemptions: e.target.value
                                                    ? Number(e.target.value)
                                                    : undefined,
                                            }))
                                        }
                                        placeholder="Bez limitu"
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
                                    disabled={
                                        createReward.isPending ||
                                        updateReward.isPending
                                    }
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                >
                                    {createReward.isPending ||
                                    updateReward.isPending
                                        ? 'Zapisywanie...'
                                        : 'Zapisz'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Use Coupon Modal */}
            {modalType === 'useCoupon' && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <form
                            onSubmit={(event) => {
                                void handleUseCoupon(event);
                            }}
                        >
                            <div className="px-6 py-4 border-b">
                                <h2 className="text-lg font-semibold">
                                    Zrealizuj kupon
                                </h2>
                            </div>
                            <div className="px-6 py-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Kod kuponu *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={couponCode}
                                    onChange={(e) =>
                                        setCouponCode(
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                    placeholder="VIP-XXXXXXXX"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 font-mono"
                                />
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
                                    disabled={useCoupon.isPending}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    {useCoupon.isPending
                                        ? 'Realizowanie...'
                                        : 'Zrealizuj'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
