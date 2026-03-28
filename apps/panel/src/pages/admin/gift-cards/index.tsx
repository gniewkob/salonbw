import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
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
    const { role } = useAuth();
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

    if (!role) return null;

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
        used: 'bg-secondary bg-opacity-10 text-body',
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
        <RouteGuard
            roles={['admin', 'receptionist']}
            permission="nav:extension"
        >
            <SalonShell role={role}>
                <div className="salonbw-page" data-testid="gift-cards-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_extensions"
                        items={[
                            { label: 'Dodatki', href: '/extension' },
                            { label: 'Bony i Karnety' },
                        ]}
                    />
                    <div className="bg-light">
                        <div className="max-w-7xl mx-auto py-4 px-3">
                            <div className="d-flex align-items-center justify-content-between mb-4">
                                <div>
                                    <h1 className="fs-3 fw-bold text-dark">
                                        Karty Podarunkowe
                                    </h1>
                                    <p className="mt-1 small text-muted">
                                        Sprzedawaj i zarządzaj kartami
                                        podarunkowymi
                                    </p>
                                </div>
                                <div className="d-flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleOpenRedeemModal}
                                        className="d-flex align-items-center gap-2 px-3 py-2 bg-white text-body border border-secondary border-opacity-50 rounded-3 fw-medium"
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
                                        Sprzedaj kartę
                                    </button>
                                </div>
                            </div>

                            {/* Stats Cards */}
                            {stats && (
                                <div className="-cols-1 gap-3 mb-4">
                                    <div className="bg-white rounded-4 shadow-sm p-4">
                                        <p className="small text-muted">
                                            Wszystkie karty
                                        </p>
                                        <p className="fs-3 fw-bold text-dark">
                                            {stats.totalCards}
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-4 shadow-sm p-4">
                                        <p className="small text-muted">
                                            Aktywne karty
                                        </p>
                                        <p className="fs-3 fw-bold text-success">
                                            {stats.activeCards}
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-4 shadow-sm p-4">
                                        <p className="small text-muted">
                                            Łączna wartość
                                        </p>
                                        <p className="fs-3 fw-bold text-dark">
                                            {formatCurrency(stats.totalValue)}
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-4 shadow-sm p-4">
                                        <p className="small text-muted">
                                            Wykorzystano
                                        </p>
                                        <p className="fs-3 fw-bold text-primary">
                                            {formatCurrency(stats.usedValue)}
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-4 shadow-sm p-4">
                                        <p className="small text-muted">
                                            Do wykorzystania
                                        </p>
                                        <p className="fs-3 fw-bold text-primary">
                                            {formatCurrency(
                                                stats.outstandingValue,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Filters */}
                            <div className="bg-white rounded-4 shadow-sm p-3 mb-4">
                                <div className="d-flex flex-wrap gap-3">
                                    <div className="flex-fill min-w-[200px]">
                                        <label className="d-block small fw-medium text-body mb-1">
                                            Szukaj po kodzie
                                        </label>
                                        <input
                                            type="text"
                                            value={searchCode}
                                            onChange={(e) =>
                                                setSearchCode(
                                                    e.target.value.toUpperCase(),
                                                )
                                            }
                                            placeholder="np. XXXX-XXXX-XXXX"
                                            className="w-100 px-3 py-2 border rounded-3 focus:"
                                        />
                                    </div>
                                    <div className="w-48">
                                        <label className="d-block small fw-medium text-body mb-1">
                                            Status
                                        </label>
                                        <select
                                            title="Status karty"
                                            aria-label="Filtruj po statusie"
                                            value={statusFilter}
                                            onChange={(e) =>
                                                setStatusFilter(
                                                    e.target.value as
                                                        | GiftCardStatus
                                                        | '',
                                                )
                                            }
                                            className="w-100 px-3 py-2 border rounded-3 focus:"
                                        >
                                            <option value="">Wszystkie</option>
                                            <option value="active">
                                                Aktywne
                                            </option>
                                            <option value="used">
                                                Wykorzystane
                                            </option>
                                            <option value="expired">
                                                Wygasłe
                                            </option>
                                            <option value="cancelled">
                                                Anulowane
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Cards Table */}
                            <div className="bg-white rounded-4 shadow-sm overflow-d-none">
                                {isLoading ? (
                                    <div className="p-4 text-center text-muted">
                                        Ładowanie...
                                    </div>
                                ) : cardsData?.data.length === 0 ? (
                                    <div className="p-4 text-center text-muted">
                                        Brak kart podarunkowych
                                    </div>
                                ) : (
                                    <table className="min-w-100">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                                    Kod
                                                </th>
                                                <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                                    Wartość / Saldo
                                                </th>
                                                <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                                    Status
                                                </th>
                                                <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                                    Odbiorca
                                                </th>
                                                <th className="px-4 py-2 text-start small fw-medium text-muted text-uppercase">
                                                    Ważna do
                                                </th>
                                                <th className="px-4 py-2 text-end small fw-medium text-muted text-uppercase">
                                                    Akcje
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white">
                                            {cardsData?.data.map((card) => {
                                                const progressStyle: React.CSSProperties =
                                                    {
                                                        width: `${(card.currentBalance / card.initialValue) * 100}%`,
                                                    };
                                                return (
                                                    <tr
                                                        key={card.id}
                                                        className=""
                                                    >
                                                        <td className="px-4 py-3 text-nowrap">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleOpenDetailsModal(
                                                                        card,
                                                                    )
                                                                }
                                                                className="font-mono small text-primary fw-medium"
                                                            >
                                                                {card.code}
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 text-nowrap">
                                                            <div className="small">
                                                                <span className="fw-medium">
                                                                    {formatCurrency(
                                                                        card.currentBalance,
                                                                        card.currency,
                                                                    )}
                                                                </span>
                                                                <span className="text-secondary">
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
                                                                <div className="w-100 bg-secondary bg-opacity-25 rounded-circle h-1.5 mt-1">
                                                                    <div
                                                                        className="bg-primary bg-opacity-10 h-1.5 rounded-circle"
                                                                        style={
                                                                            progressStyle
                                                                        }
                                                                    />
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-nowrap">
                                                            <span
                                                                className={`inline-d-flex px-2 py-1 small fw-semibold rounded-circle ${STATUS_COLORS[card.status]}`}
                                                            >
                                                                {
                                                                    STATUS_LABELS[
                                                                        card
                                                                            .status
                                                                    ]
                                                                }
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-nowrap small text-body">
                                                            {card.recipientName ||
                                                                card.recipient
                                                                    ?.name ||
                                                                '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-nowrap small text-body">
                                                            {format(
                                                                new Date(
                                                                    card.validUntil,
                                                                ),
                                                                'd MMM yyyy',
                                                                { locale: pl },
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-nowrap text-end small fw-medium">
                                                            <div className="d-flex justify-content-end gap-2">
                                                                {card.status ===
                                                                    'active' && (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleOpenEditModal(
                                                                                    card,
                                                                                )
                                                                            }
                                                                            className="text-muted"
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
                                                                        {role ===
                                                                            'admin' && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    handleOpenAdjustModal(
                                                                                        card,
                                                                                    )
                                                                                }
                                                                                className="text-primary"
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
                                                                        {role ===
                                                                            'admin' && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    void handleCancel(
                                                                                        card,
                                                                                    )
                                                                                }
                                                                                className="text-danger"
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
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}

                                {/* Pagination */}
                                {cardsData && cardsData.total > 20 && (
                                    <div className="bg-white px-3 py-2 border-top d-flex align-items-center justify-content-between">
                                        <div className="small text-body">
                                            Strona {page} z{' '}
                                            {Math.ceil(cardsData.total / 20)}
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPage((p) =>
                                                        Math.max(1, p - 1),
                                                    )
                                                }
                                                disabled={page === 1}
                                                className="px-3 py-1 border rounded small"
                                            >
                                                Poprzednia
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPage((p) => p + 1)
                                                }
                                                disabled={
                                                    page >=
                                                    Math.ceil(
                                                        cardsData.total / 20,
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
                        </div>

                        {/* Create Modal */}
                        {modalType === 'create' && (
                            <div className="position-fixed top-0 start-0 bottom-0 end-0 bg-dark/50 d-flex align-items-center justify-content-center">
                                <div className="bg-white rounded-4 shadow-lg w-100 mx-4 max-h-[90vh] overflow-y-auto">
                                    <form
                                        onSubmit={(event) => {
                                            void handleCreate(event);
                                        }}
                                    >
                                        <div className="px-4 py-3 border-bottom">
                                            <h2 className="fs-5 fw-semibold">
                                                Sprzedaj kartę podarunkową
                                            </h2>
                                        </div>
                                        <div className="px-4 py-3 gap-2">
                                            <div>
                                                <label className="d-block small fw-medium text-body mb-1">
                                                    Wartość karty (PLN) *
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    min={1}
                                                    title="Wartość karty (PLN)"
                                                    placeholder="100"
                                                    value={
                                                        createForm.initialValue
                                                    }
                                                    onChange={(e) =>
                                                        setCreateForm((f) => ({
                                                            ...f,
                                                            initialValue:
                                                                Number(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                        }))
                                                    }
                                                    className="w-100 px-3 py-2 border rounded-3 focus:"
                                                />
                                            </div>
                                            <div className="-cols-2 gap-3">
                                                <div>
                                                    <label className="d-block small fw-medium text-body mb-1">
                                                        Ważna od *
                                                    </label>
                                                    <input
                                                        type="date"
                                                        required
                                                        title="Ważna od"
                                                        value={
                                                            createForm.validFrom
                                                        }
                                                        onChange={(e) =>
                                                            setCreateForm(
                                                                (f) => ({
                                                                    ...f,
                                                                    validFrom:
                                                                        e.target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                        className="w-100 px-3 py-2 border rounded-3 focus:"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="d-block small fw-medium text-body mb-1">
                                                        Ważna do *
                                                    </label>
                                                    <input
                                                        type="date"
                                                        required
                                                        title="Ważna do"
                                                        value={
                                                            createForm.validUntil
                                                        }
                                                        onChange={(e) =>
                                                            setCreateForm(
                                                                (f) => ({
                                                                    ...f,
                                                                    validUntil:
                                                                        e.target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                        className="w-100 px-3 py-2 border rounded-3 focus:"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="d-block small fw-medium text-body mb-1">
                                                    Nazwa odbiorcy
                                                </label>
                                                <input
                                                    type="text"
                                                    title="Nazwa odbiorcy"
                                                    placeholder="Imię i nazwisko"
                                                    value={
                                                        createForm.recipientName ??
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setCreateForm((f) => ({
                                                            ...f,
                                                            recipientName:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    className="w-100 px-3 py-2 border rounded-3 focus:"
                                                />
                                            </div>
                                            <div>
                                                <label className="d-block small fw-medium text-body mb-1">
                                                    Email odbiorcy
                                                </label>
                                                <input
                                                    type="email"
                                                    title="Email odbiorcy"
                                                    placeholder="adres@email.pl"
                                                    value={
                                                        createForm.recipientEmail ??
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setCreateForm((f) => ({
                                                            ...f,
                                                            recipientEmail:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    className="w-100 px-3 py-2 border rounded-3 focus:"
                                                />
                                            </div>
                                            <div>
                                                <label className="d-block small fw-medium text-body mb-1">
                                                    Wiadomość (życzenia)
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={
                                                        createForm.message ?? ''
                                                    }
                                                    onChange={(e) =>
                                                        setCreateForm((f) => ({
                                                            ...f,
                                                            message:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    className="w-100 px-3 py-2 border rounded-3 focus:"
                                                    placeholder="Wszystkiego najlepszego z okazji urodzin!"
                                                />
                                            </div>
                                        </div>
                                        <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setModalType(null)
                                                }
                                                className="px-3 py-2 border rounded-3"
                                            >
                                                Anuluj
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={
                                                    createGiftCard.isPending
                                                }
                                                className="px-3 py-2 bg-primary bg-opacity-10 text-white rounded-3 bg-opacity-10"
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
                            <div className="position-fixed top-0 start-0 bottom-0 end-0 bg-dark/50 d-flex align-items-center justify-content-center">
                                <div className="bg-white rounded-4 shadow-lg w-100 mx-4 max-h-[90vh] overflow-y-auto">
                                    <form
                                        onSubmit={(event) => {
                                            void handleUpdate(event);
                                        }}
                                    >
                                        <div className="px-4 py-3 border-bottom">
                                            <h2 className="fs-5 fw-semibold">
                                                Edytuj kartę {selectedCard.code}
                                            </h2>
                                        </div>
                                        <div className="px-4 py-3 gap-2">
                                            <div>
                                                <label className="d-block small fw-medium text-body mb-1">
                                                    Ważna do
                                                </label>
                                                <input
                                                    type="date"
                                                    title="Ważna do"
                                                    value={
                                                        editForm.validUntil ??
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setEditForm((f) => ({
                                                            ...f,
                                                            validUntil:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    className="w-100 px-3 py-2 border rounded-3 focus:"
                                                />
                                            </div>
                                            <div>
                                                <label className="d-block small fw-medium text-body mb-1">
                                                    Nazwa odbiorcy
                                                </label>
                                                <input
                                                    type="text"
                                                    title="Nazwa odbiorcy"
                                                    placeholder="Imię i nazwisko"
                                                    value={
                                                        editForm.recipientName ??
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setEditForm((f) => ({
                                                            ...f,
                                                            recipientName:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    className="w-100 px-3 py-2 border rounded-3 focus:"
                                                />
                                            </div>
                                            <div>
                                                <label className="d-block small fw-medium text-body mb-1">
                                                    Email odbiorcy
                                                </label>
                                                <input
                                                    type="email"
                                                    title="Email odbiorcy"
                                                    placeholder="adres@email.pl"
                                                    value={
                                                        editForm.recipientEmail ??
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setEditForm((f) => ({
                                                            ...f,
                                                            recipientEmail:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    className="w-100 px-3 py-2 border rounded-3 focus:"
                                                />
                                            </div>
                                            <div>
                                                <label className="d-block small fw-medium text-body mb-1">
                                                    Wiadomość
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    title="Wiadomość"
                                                    placeholder="Treść wiadomości"
                                                    value={
                                                        editForm.message ?? ''
                                                    }
                                                    onChange={(e) =>
                                                        setEditForm((f) => ({
                                                            ...f,
                                                            message:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    className="w-100 px-3 py-2 border rounded-3 focus:"
                                                />
                                            </div>
                                            <div>
                                                <label className="d-block small fw-medium text-body mb-1">
                                                    Notatki wewnętrzne
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    title="Notatki wewnętrzne"
                                                    placeholder="Dodatkowe informacje..."
                                                    value={editForm.notes ?? ''}
                                                    onChange={(e) =>
                                                        setEditForm((f) => ({
                                                            ...f,
                                                            notes: e.target
                                                                .value,
                                                        }))
                                                    }
                                                    className="w-100 px-3 py-2 border rounded-3 focus:"
                                                />
                                            </div>
                                        </div>
                                        <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setModalType(null)
                                                }
                                                className="px-3 py-2 border rounded-3"
                                            >
                                                Anuluj
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={
                                                    updateGiftCard.isPending
                                                }
                                                className="px-3 py-2 bg-primary bg-opacity-10 text-white rounded-3 bg-opacity-10"
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
                            <div className="position-fixed top-0 start-0 bottom-0 end-0 bg-dark/50 d-flex align-items-center justify-content-center">
                                <div className="bg-white rounded-4 shadow-lg w-100 mx-4">
                                    <form
                                        onSubmit={(event) => {
                                            void handleRedeem(event);
                                        }}
                                    >
                                        <div className="px-4 py-3 border-bottom">
                                            <h2 className="fs-5 fw-semibold">
                                                Zrealizuj kartę podarunkową
                                            </h2>
                                        </div>
                                        <div className="px-4 py-3 gap-2">
                                            <div>
                                                <label className="d-block small fw-medium text-body mb-1">
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
                                                    className="w-100 px-3 py-2 border rounded-3 focus: font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="d-block small fw-medium text-body mb-1">
                                                    Kwota do pobrania (PLN) *
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    min={0.01}
                                                    step={0.01}
                                                    title="Kwota do pobrania (PLN)"
                                                    placeholder="0.00"
                                                    value={redeemForm.amount}
                                                    onChange={(e) =>
                                                        setRedeemForm((f) => ({
                                                            ...f,
                                                            amount: Number(
                                                                e.target.value,
                                                            ),
                                                        }))
                                                    }
                                                    className="w-100 px-3 py-2 border rounded-3 focus:"
                                                />
                                            </div>
                                            <div>
                                                <label className="d-block small fw-medium text-body mb-1">
                                                    Notatka
                                                </label>
                                                <input
                                                    type="text"
                                                    value={redeemForm.notes}
                                                    onChange={(e) =>
                                                        setRedeemForm((f) => ({
                                                            ...f,
                                                            notes: e.target
                                                                .value,
                                                        }))
                                                    }
                                                    placeholder="np. wizyta #123"
                                                    className="w-100 px-3 py-2 border rounded-3 focus:"
                                                />
                                            </div>
                                        </div>
                                        <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setModalType(null)
                                                }
                                                className="px-3 py-2 border rounded-3"
                                            >
                                                Anuluj
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={
                                                    redeemGiftCard.isPending
                                                }
                                                className="px-3 py-2 bg-success bg-opacity-10 text-white rounded-3 bg-opacity-10"
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
                            <div className="position-fixed top-0 start-0 bottom-0 end-0 bg-dark/50 d-flex align-items-center justify-content-center">
                                <div className="bg-white rounded-4 shadow-lg w-100 mx-4">
                                    <form
                                        onSubmit={(event) => {
                                            void handleAdjust(event);
                                        }}
                                    >
                                        <div className="px-4 py-3 border-bottom">
                                            <h2 className="fs-5 fw-semibold">
                                                Korekta salda karty{' '}
                                                {selectedCard.code}
                                            </h2>
                                        </div>
                                        <div className="px-4 py-3 gap-2">
                                            <div className="bg-light rounded-3 p-3">
                                                <p className="small text-muted">
                                                    Aktualne saldo:
                                                </p>
                                                <p className="fs-5 fw-bold">
                                                    {formatCurrency(
                                                        selectedCard.currentBalance,
                                                        selectedCard.currency,
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="d-block small fw-medium text-body mb-1">
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
                                                            amount: Number(
                                                                e.target.value,
                                                            ),
                                                        }))
                                                    }
                                                    placeholder="Dodatnia = doładowanie, ujemna = obciążenie"
                                                    className="w-100 px-3 py-2 border rounded-3 focus:"
                                                />
                                                <p className="small text-muted mt-1">
                                                    Nowe saldo:{' '}
                                                    {formatCurrency(
                                                        selectedCard.currentBalance +
                                                            adjustForm.amount,
                                                        selectedCard.currency,
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="d-block small fw-medium text-body mb-1">
                                                    Powód korekty *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={adjustForm.notes}
                                                    onChange={(e) =>
                                                        setAdjustForm((f) => ({
                                                            ...f,
                                                            notes: e.target
                                                                .value,
                                                        }))
                                                    }
                                                    placeholder="np. Zwrot za anulowaną wizytę"
                                                    className="w-100 px-3 py-2 border rounded-3 focus:"
                                                />
                                            </div>
                                        </div>
                                        <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setModalType(null)
                                                }
                                                className="px-3 py-2 border rounded-3"
                                            >
                                                Anuluj
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={
                                                    adjustBalance.isPending
                                                }
                                                className="px-3 py-2 bg-primary bg-opacity-10 text-white rounded-3 bg-opacity-10"
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
                            <div className="position-fixed top-0 start-0 bottom-0 end-0 bg-dark/50 d-flex align-items-center justify-content-center">
                                <div className="bg-white rounded-4 shadow-lg w-100 mx-4 max-h-[90vh] overflow-y-auto">
                                    <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center">
                                        <h2 className="fs-5 fw-semibold">
                                            Szczegóły karty {selectedCard.code}
                                        </h2>
                                        <button
                                            type="button"
                                            title="Zamknij"
                                            aria-label="Zamknij okno"
                                            onClick={() => setModalType(null)}
                                            className="text-secondary"
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
                                    <div className="px-4 py-3">
                                        <div className="-cols-2 gap-3 mb-4">
                                            <div>
                                                <p className="small text-muted">
                                                    Kod karty
                                                </p>
                                                <p className="font-mono fs-5 fw-bold">
                                                    {selectedCard.code}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="small text-muted">
                                                    Status
                                                </p>
                                                <span
                                                    className={`inline-d-flex px-2 py-1 small fw-semibold rounded-circle ${STATUS_COLORS[selectedCard.status]}`}
                                                >
                                                    {
                                                        STATUS_LABELS[
                                                            selectedCard.status
                                                        ]
                                                    }
                                                </span>
                                            </div>
                                            <div>
                                                <p className="small text-muted">
                                                    Wartość początkowa
                                                </p>
                                                <p className="fw-medium">
                                                    {formatCurrency(
                                                        selectedCard.initialValue,
                                                        selectedCard.currency,
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="small text-muted">
                                                    Aktualne saldo
                                                </p>
                                                <p className="fw-medium text-primary">
                                                    {formatCurrency(
                                                        selectedCard.currentBalance,
                                                        selectedCard.currency,
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="small text-muted">
                                                    Ważna od
                                                </p>
                                                <p className="fw-medium">
                                                    {format(
                                                        new Date(
                                                            selectedCard.validFrom,
                                                        ),
                                                        'd MMM yyyy',
                                                        { locale: pl },
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="small text-muted">
                                                    Ważna do
                                                </p>
                                                <p className="fw-medium">
                                                    {format(
                                                        new Date(
                                                            selectedCard.validUntil,
                                                        ),
                                                        'd MMM yyyy',
                                                        { locale: pl },
                                                    )}
                                                </p>
                                            </div>
                                            {selectedCard.recipientName && (
                                                <div>
                                                    <p className="small text-muted">
                                                        Odbiorca
                                                    </p>
                                                    <p className="fw-medium">
                                                        {
                                                            selectedCard.recipientName
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                            {selectedCard.recipientEmail && (
                                                <div>
                                                    <p className="small text-muted">
                                                        Email odbiorcy
                                                    </p>
                                                    <p className="fw-medium">
                                                        {
                                                            selectedCard.recipientEmail
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                            {selectedCard.message && (
                                                <div className="">
                                                    <p className="small text-muted">
                                                        Wiadomość
                                                    </p>
                                                    <p className="fw-medium fst-italic">
                                                        &quot;
                                                        {selectedCard.message}
                                                        &quot;
                                                    </p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="small text-muted">
                                                    Sprzedawca
                                                </p>
                                                <p className="fw-medium">
                                                    {selectedCard.soldBy
                                                        ?.name ?? '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="small text-muted">
                                                    Data sprzedaży
                                                </p>
                                                <p className="fw-medium">
                                                    {selectedCard.soldAt
                                                        ? format(
                                                              new Date(
                                                                  selectedCard.soldAt,
                                                              ),
                                                              'd MMM yyyy HH:mm',
                                                              { locale: pl },
                                                          )
                                                        : '-'}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="fw-semibold mb-2">
                                                Historia transakcji
                                            </h3>
                                            {transactions?.length === 0 ? (
                                                <p className="text-muted small">
                                                    Brak transakcji
                                                </p>
                                            ) : (
                                                <div className="border rounded-3 overflow-d-none">
                                                    <table className="min-w-100">
                                                        <thead className="bg-light">
                                                            <tr>
                                                                <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                                                                    Data
                                                                </th>
                                                                <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                                                                    Typ
                                                                </th>
                                                                <th className="px-3 py-2 text-end small fw-medium text-muted text-uppercase">
                                                                    Kwota
                                                                </th>
                                                                <th className="px-3 py-2 text-end small fw-medium text-muted text-uppercase">
                                                                    Saldo
                                                                </th>
                                                                <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                                                                    Wykonawca
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="">
                                                            {transactions?.map(
                                                                (tx) => (
                                                                    <tr
                                                                        key={
                                                                            tx.id
                                                                        }
                                                                    >
                                                                        <td className="px-3 py-2 small">
                                                                            {format(
                                                                                new Date(
                                                                                    tx.createdAt,
                                                                                ),
                                                                                'd MMM HH:mm',
                                                                                {
                                                                                    locale: pl,
                                                                                },
                                                                            )}
                                                                        </td>
                                                                        <td className="px-3 py-2 small">
                                                                            {
                                                                                TRANSACTION_TYPE_LABELS[
                                                                                    tx
                                                                                        .type
                                                                                ]
                                                                            }
                                                                        </td>
                                                                        <td
                                                                            className={`px-3 py-2 small text-end fw-medium ${tx.amount >= 0 ? 'text-success' : 'text-danger'}`}
                                                                        >
                                                                            {tx.amount >=
                                                                            0
                                                                                ? '+'
                                                                                : ''}
                                                                            {formatCurrency(
                                                                                tx.amount,
                                                                                selectedCard.currency,
                                                                            )}
                                                                        </td>
                                                                        <td className="px-3 py-2 small text-end">
                                                                            {formatCurrency(
                                                                                tx.balanceAfter,
                                                                                selectedCard.currency,
                                                                            )}
                                                                        </td>
                                                                        <td className="px-3 py-2 small">
                                                                            {tx
                                                                                .performedBy
                                                                                ?.name ??
                                                                                '-'}
                                                                        </td>
                                                                    </tr>
                                                                ),
                                                            )}
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
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
