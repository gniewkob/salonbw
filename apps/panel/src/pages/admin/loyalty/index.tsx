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
            <div className="d-flex align-items-center justify-content-center">
                <p className="text-muted">Brak dostępu</p>
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
        <div className="bg-light">
            <div className="max-w-7xl mx-auto py-4 px-3">
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <div>
                        <h1 className="fs-3 fw-bold text-dark">
                            Program Lojalnościowy
                        </h1>
                        <p className="mt-1 small text-muted">
                            Zarządzaj punktami i nagrodami dla klientów
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setModalType('useCoupon')}
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
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        Zrealizuj kupon
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-bottom border-secondary border-opacity-25 mb-4">
                    <nav className="-mb-px d-flex space-x-8">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-3 px-1 border-bottom-2 fw-medium small ${
                                    activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted border-opacity-50'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="gap-3">
                        {/* Stats Cards */}
                        {stats && (
                            <div className="-cols-1 gap-3">
                                <div className="bg-white rounded-4 shadow-sm p-4">
                                    <p className="small text-muted">
                                        Członkowie programu
                                    </p>
                                    <p className="fs-3 fw-bold text-dark">
                                        {stats.totalMembers}
                                    </p>
                                    <p className="small text-success">
                                        {stats.activeMembers} aktywnych
                                    </p>
                                </div>
                                <div className="bg-white rounded-4 shadow-sm p-4">
                                    <p className="small text-muted">
                                        Wydane punkty
                                    </p>
                                    <p className="fs-3 fw-bold text-dark">
                                        {stats.totalPointsIssued.toLocaleString(
                                            'pl-PL',
                                        )}
                                    </p>
                                </div>
                                <div className="bg-white rounded-4 shadow-sm p-4">
                                    <p className="small text-muted">
                                        Wykorzystane punkty
                                    </p>
                                    <p className="fs-3 fw-bold text-primary">
                                        {stats.totalPointsRedeemed.toLocaleString(
                                            'pl-PL',
                                        )}
                                    </p>
                                </div>
                                <div className="bg-white rounded-4 shadow-sm p-4">
                                    <p className="small text-muted">
                                        Zaległe zobowiązanie
                                    </p>
                                    <p className="fs-3 fw-bold text-primary">
                                        {formatCurrency(stats.outstandingValue)}
                                    </p>
                                    <p className="small text-muted">
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
                            <div className="bg-white rounded-4 shadow-sm p-4">
                                <h2 className="fs-5 fw-semibold mb-3">
                                    Zasady programu
                                </h2>
                                <div className="-cols-2 gap-3">
                                    <div>
                                        <p className="small text-muted">
                                            Punkty za 1 PLN
                                        </p>
                                        <p className="fw-medium">
                                            {program.pointsPerCurrency} pkt
                                        </p>
                                    </div>
                                    <div>
                                        <p className="small text-muted">
                                            Wartość 1 punktu
                                        </p>
                                        <p className="fw-medium">
                                            {(
                                                Number(
                                                    program.pointsValueCurrency,
                                                ) * 100
                                            ).toFixed(0)}{' '}
                                            gr
                                        </p>
                                    </div>
                                    <div>
                                        <p className="small text-muted">
                                            Min. do wymiany
                                        </p>
                                        <p className="fw-medium">
                                            {program.minPointsRedemption} pkt
                                        </p>
                                    </div>
                                    <div>
                                        <p className="small text-muted">
                                            Wygasanie punktów
                                        </p>
                                        <p className="fw-medium">
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
                            <div className="bg-white rounded-4 shadow-sm p-4">
                                <h2 className="fs-5 fw-semibold mb-3">
                                    Nagrody
                                </h2>
                                <p className="text-muted">
                                    Zrealizowano{' '}
                                    <span className="fw-bold">
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
                        <div className="d-flex justify-content-end mb-3">
                            <button
                                type="button"
                                onClick={handleOpenCreateReward}
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
                                Dodaj nagrodę
                            </button>
                        </div>

                        <div className="bg-white rounded-4 shadow-sm overflow-d-none">
                            {rewardsLoading ? (
                                <div className="p-4 text-center text-muted">
                                    Ładowanie...
                                </div>
                            ) : rewardsData?.data.length === 0 ? (
                                <div className="p-4 text-center text-muted">
                                    Brak nagród w katalogu
                                </div>
                            ) : (
                                <table className="min-w-100">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                                Nazwa
                                            </th>
                                            <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                                Typ
                                            </th>
                                            <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                                Koszt
                                            </th>
                                            <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                                Realizacje
                                            </th>
                                            <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                                Status
                                            </th>
                                            <th className="px-4 py-2 text-end small fw-medium text-muted text-uppercase">
                                                Akcje
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="">
                                        {rewardsData?.data.map((reward) => (
                                            <tr key={reward.id} className="">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="fw-medium text-dark">
                                                            {reward.name}
                                                        </p>
                                                        {reward.description && (
                                                            <p className="small text-muted">
                                                                {
                                                                    reward.description
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 small">
                                                    {
                                                        REWARD_TYPE_LABELS[
                                                            reward.type
                                                        ]
                                                    }
                                                </td>
                                                <td className="px-4 py-3 small fw-medium">
                                                    {reward.pointsCost} pkt
                                                </td>
                                                <td className="px-4 py-3 small">
                                                    {reward.currentRedemptions}
                                                    {reward.maxRedemptions &&
                                                        ` / ${reward.maxRedemptions}`}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-d-flex px-2 py-1 small fw-semibold rounded-circle ${
                                                            reward.isActive
                                                                ? 'bg-success bg-opacity-10 text-success'
                                                                : 'bg-light text-body'
                                                        }`}
                                                    >
                                                        {reward.isActive
                                                            ? 'Aktywna'
                                                            : 'Nieaktywna'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-end">
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleOpenEditReward(
                                                                    reward,
                                                                )
                                                            }
                                                            className="text-muted"
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
                                                            className="text-danger"
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
                    <div className="bg-white rounded-4 shadow-sm overflow-d-none">
                        {transactionsLoading ? (
                            <div className="p-4 text-center text-muted">
                                Ładowanie...
                            </div>
                        ) : transactionsData?.data.length === 0 ? (
                            <div className="p-4 text-center text-muted">
                                Brak transakcji
                            </div>
                        ) : (
                            <table className="min-w-100">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                            Data
                                        </th>
                                        <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                            Klient
                                        </th>
                                        <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                            Typ
                                        </th>
                                        <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                            Źródło
                                        </th>
                                        <th className="px-4 py-2 text-end small fw-medium text-muted text-uppercase">
                                            Punkty
                                        </th>
                                        <th className="px-4 py-2 text-end small fw-medium text-muted text-uppercase">
                                            Saldo
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="">
                                    {transactionsData?.data.map((tx) => (
                                        <tr key={tx.id} className="">
                                            <td className="px-4 py-3 small">
                                                {format(
                                                    new Date(tx.createdAt),
                                                    'd MMM yyyy HH:mm',
                                                    { locale: pl },
                                                )}
                                            </td>
                                            <td className="px-4 py-3 small">
                                                {tx.user?.name ?? '-'}
                                            </td>
                                            <td className="px-4 py-3 small">
                                                {
                                                    TRANSACTION_TYPE_LABELS[
                                                        tx.type
                                                    ]
                                                }
                                            </td>
                                            <td className="px-4 py-3 small">
                                                {SOURCE_LABELS[tx.source]}
                                            </td>
                                            <td
                                                className={`px-4 py-3 small text-end fw-medium ${tx.points >= 0 ? 'text-success' : 'text-danger'}`}
                                            >
                                                {tx.points >= 0 ? '+' : ''}
                                                {tx.points}
                                            </td>
                                            <td className="px-4 py-3 small text-end">
                                                {tx.balanceAfter}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {transactionsData && transactionsData.total > 20 && (
                            <div className="px-3 py-2 border-top d-flex align-items-center justify-content-between">
                                <div className="small text-body">
                                    Strona {page} z{' '}
                                    {Math.ceil(transactionsData.total / 20)}
                                </div>
                                <div className="d-flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPage((p) => Math.max(1, p - 1))
                                        }
                                        disabled={page === 1}
                                        className="px-3 py-1 border rounded small"
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
                                        className="px-3 py-1 border rounded small"
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
                    <div className="bg-white rounded-4 shadow-sm p-4">
                        <h2 className="fs-5 fw-semibold mb-4">
                            Ustawienia programu
                        </h2>
                        <form
                            onSubmit={(event) => {
                                void handleUpdateSettings(event);
                            }}
                            className="gap-3"
                        >
                            <div className="-cols-2 gap-3">
                                <div>
                                    <label className="d-block small fw-medium text-body mb-1">
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
                                        className="w-100 px-3 py-2 border rounded-3 focus:"
                                    />
                                </div>
                                <div>
                                    <label className="d-block small fw-medium text-body mb-1">
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
                                        className="w-100 px-3 py-2 border rounded-3 focus:"
                                    />
                                </div>
                            </div>

                            <div className="-cols-2 gap-3">
                                <div>
                                    <label className="d-block small fw-medium text-body mb-1">
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
                                        className="w-100 px-3 py-2 border rounded-3 focus:"
                                    />
                                </div>
                                <div>
                                    <label className="d-block small fw-medium text-body mb-1">
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
                                        className="w-100 px-3 py-2 border rounded-3 focus:"
                                    />
                                </div>
                            </div>

                            <div className="border-top pt-3">
                                <h3 className="fw-medium mb-2">Bonusy</h3>
                                <div className="-cols-3 gap-3">
                                    <div>
                                        <label className="d-block small fw-medium text-body mb-1">
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
                                            className="w-100 px-3 py-2 border rounded-3 focus:"
                                        />
                                    </div>
                                    <div>
                                        <label className="d-block small fw-medium text-body mb-1">
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
                                            className="w-100 px-3 py-2 border rounded-3 focus:"
                                        />
                                    </div>
                                    <div>
                                        <label className="d-block small fw-medium text-body mb-1">
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
                                            className="w-100 px-3 py-2 border rounded-3 focus:"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="d-flex justify-content-end">
                                <button
                                    type="submit"
                                    disabled={updateProgram.isPending}
                                    className="px-4 py-2 bg-primary bg-opacity-10 text-white rounded-3 bg-opacity-10"
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
                <div className="position-fixed top-0 start-0 bottom-0 end-0 bg-dark/50 d-flex align-items-center justify-content-center">
                    <div className="bg-white rounded-4 shadow-lg w-100 mx-4 max-h-[90vh] overflow-y-auto">
                        <form
                            onSubmit={(event) => {
                                void handleSaveReward(event);
                            }}
                        >
                            <div className="px-4 py-3 border-bottom">
                                <h2 className="fs-5 fw-semibold">
                                    {selectedReward
                                        ? 'Edytuj nagrodę'
                                        : 'Dodaj nagrodę'}
                                </h2>
                            </div>
                            <div className="px-4 py-3 gap-2">
                                <div>
                                    <label className="d-block small fw-medium text-body mb-1">
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
                                        className="w-100 px-3 py-2 border rounded-3 focus:"
                                    />
                                </div>
                                <div>
                                    <label className="d-block small fw-medium text-body mb-1">
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
                                        className="w-100 px-3 py-2 border rounded-3 focus:"
                                    />
                                </div>
                                <div className="-cols-2 gap-3">
                                    <div>
                                        <label className="d-block small fw-medium text-body mb-1">
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
                                            className="w-100 px-3 py-2 border rounded-3 focus:"
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
                                        <label className="d-block small fw-medium text-body mb-1">
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
                                            className="w-100 px-3 py-2 border rounded-3 focus:"
                                        />
                                    </div>
                                </div>
                                {rewardForm.type === 'discount' && (
                                    <div className="-cols-2 gap-3">
                                        <div>
                                            <label className="d-block small fw-medium text-body mb-1">
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
                                                className="w-100 px-3 py-2 border rounded-3 focus:"
                                            />
                                        </div>
                                        <div>
                                            <label className="d-block small fw-medium text-body mb-1">
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
                                                className="w-100 px-3 py-2 border rounded-3 focus:"
                                            />
                                        </div>
                                    </div>
                                )}
                                {rewardForm.type === 'gift_card' && (
                                    <div>
                                        <label className="d-block small fw-medium text-body mb-1">
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
                                            className="w-100 px-3 py-2 border rounded-3 focus:"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="d-block small fw-medium text-body mb-1">
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
                                        className="w-100 px-3 py-2 border rounded-3 focus:"
                                    />
                                </div>
                            </div>
                            <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModalType(null)}
                                    className="px-3 py-2 border rounded-3"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        createReward.isPending ||
                                        updateReward.isPending
                                    }
                                    className="px-3 py-2 bg-primary bg-opacity-10 text-white rounded-3 bg-opacity-10"
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
                <div className="position-fixed top-0 start-0 bottom-0 end-0 bg-dark/50 d-flex align-items-center justify-content-center">
                    <div className="bg-white rounded-4 shadow-lg w-100 mx-4">
                        <form
                            onSubmit={(event) => {
                                void handleUseCoupon(event);
                            }}
                        >
                            <div className="px-4 py-3 border-bottom">
                                <h2 className="fs-5 fw-semibold">
                                    Zrealizuj kupon
                                </h2>
                            </div>
                            <div className="px-4 py-3">
                                <label className="d-block small fw-medium text-body mb-1">
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
                                    className="w-100 px-3 py-2 border rounded-3 focus: font-mono"
                                />
                            </div>
                            <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModalType(null)}
                                    className="px-3 py-2 border rounded-3"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    disabled={useCoupon.isPending}
                                    className="px-3 py-2 bg-success bg-opacity-10 text-white rounded-3 bg-opacity-10"
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
