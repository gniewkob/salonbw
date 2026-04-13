import { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useCashRegister } from '@/hooks/useStatistics';
import type { CashRegisterSummary } from '@/types';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    cash: 'Gotówka',
    card: 'Karta',
    transfer: 'Przelew',
    online: 'Online',
    voucher: 'Voucher',
};

const ENTRY_TYPE_LABELS: Record<
    CashRegisterSummary['entries'][number]['type'],
    string
> = {
    appointment: 'Wizyta',
    product: 'Produkt',
    other: 'Inne',
};

export default function CashRegisterPage() {
    const { role } = useAuth();
    const [selectedDate, setSelectedDate] = useState(
        format(new Date(), 'yyyy-MM-dd'),
    );
    const [activeTab, setActiveTab] = useState<'register' | 'history'>(
        'register',
    );
    const { data, isLoading } = useCashRegister(selectedDate);

    const navigateDate = (direction: 'prev' | 'next') => {
        const current = new Date(selectedDate);
        const newDate =
            direction === 'prev' ? subDays(current, 1) : addDays(current, 1);
        setSelectedDate(format(newDate, 'yyyy-MM-dd'));
    };

    const formatMoney = (value: number): string => {
        return value.toFixed(2).replace('.', ',') + ' zł';
    };

    // Calculate summary from entries
    const calculateSummary = (entries: CashRegisterSummary['entries']) => {
        const summary = {
            appointments: 0,
            products: 0,
            tips: 0,
            other: 0,
            total: 0,
        };

        entries.forEach((entry) => {
            if (entry.type === 'appointment') {
                summary.appointments += entry.amount;
            } else if (entry.type === 'product') {
                summary.products += entry.amount;
            }
            summary.tips += entry.tip;
            summary.total += entry.amount;
        });

        return summary;
    };

    const summary = data ? calculateSummary(data.entries) : null;
    const entries = data?.entries ?? [];
    const chronologicalEntries = [...entries].sort((a, b) =>
        `${b.time}`.localeCompare(`${a.time}`),
    );
    const inflowEntries = chronologicalEntries.filter(
        (entry) => entry.amount > 0,
    );
    const outflowEntries = chronologicalEntries.filter(
        (entry) => entry.amount < 0,
    );
    const otherOperationEntries = chronologicalEntries.filter(
        (entry) => entry.type === 'other',
    );
    const paymentTotals = data
        ? [
              {
                  label: 'Gotówka',
                  value: data.totals.cash,
              },
              {
                  label: 'Karta',
                  value: data.totals.card,
              },
              {
                  label: 'Przelew',
                  value: data.totals.transfer,
              },
              {
                  label: 'Online',
                  value: data.totals.online,
              },
              {
                  label: 'Voucher',
                  value: data.totals.voucher,
              },
          ].filter((item) => item.value !== 0)
        : [];

    if (!role) return null;

    return (
        <SalonShell role={role}>
            <div className="salonbw-page" data-testid="cash-register-page">
                <SalonBreadcrumbs
                    iconClass="sprite-breadcrumbs_statistics"
                    items={[
                        { label: 'Statystyki', href: '/statistics' },
                        { label: 'Stan kasy' },
                    ]}
                />

                <div className="salonbw-page__toolbar">
                    <div className="salonbw-actions">
                        <button
                            type="button"
                            className="salonbw-toolbar-btn btn btn-default"
                            onClick={() => navigateDate('prev')}
                        >
                            ◀
                        </button>
                        <input
                            type="date"
                            aria-label="Wybierz datę"
                            className="form-control salonbw-toolbar-search"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                        <button
                            type="button"
                            className="salonbw-toolbar-btn btn btn-default"
                            onClick={() => navigateDate('next')}
                        >
                            ▶
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-4 border-bottom">
                    <div className="nav-tabs">
                        <button
                            type="button"
                            className={activeTab === 'register' ? 'active' : ''}
                            onClick={() => setActiveTab('register')}
                        >
                            Stan kasy
                        </button>
                        <button
                            type="button"
                            className={activeTab === 'history' ? 'active' : ''}
                            onClick={() => setActiveTab('history')}
                        >
                            Historia operacji kasowych
                        </button>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="p-4 d-flex gap-2 justify-content-center">
                    <button
                        type="button"
                        className="btn btn-primary"
                        disabled
                        title="Operacje ręczne nie są jeszcze dostępne w tym widoku"
                    >
                        dodaj wpływ (kasa przyjmie)
                    </button>
                    <button
                        type="button"
                        className="btn btn-default"
                        disabled
                        title="Operacje ręczne nie są jeszcze dostępne w tym widoku"
                    >
                        dodaj wypływ (kasa wypłaci)
                    </button>
                </div>

                {isLoading ? (
                    <div className="p-4 small salonbw-muted">Ładowanie...</div>
                ) : activeTab === 'register' ? (
                    <>
                        {/* Status header */}
                        <div className="d-flex align-items-center gap-3 mb-4">
                            <h2 className="fs-4 fw-normal mb-0">
                                kasa otwarta
                            </h2>
                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                disabled
                                title="Zamykanie kasy nie jest jeszcze dostępne w tym widoku"
                            >
                                zamknij kasę
                            </button>
                        </div>

                        {/* Summary cards */}
                        {data && summary && (
                            <div className="row g-4 mb-5">
                                {/* Current balance */}
                                <div className="col-3">
                                    <div className="border rounded p-4 text-center bg-primary bg-opacity-10">
                                        <div className="small text-muted mb-2">
                                            aktualny stan kasy
                                        </div>
                                        <div className="fs-3 fw-bold text-primary">
                                            {formatMoney(
                                                data.totals.total +
                                                    summary.tips,
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Initial balance */}
                                <div className="col-3">
                                    <div className="border rounded p-4 text-center">
                                        <div className="small text-muted mb-2">
                                            stan początkowy
                                        </div>
                                        <div className="fs-5 fw-semibold">
                                            {formatMoney(0)}
                                        </div>
                                        <div className="small text-muted mt-1">
                                            na dzień:{' '}
                                            {format(
                                                new Date(selectedDate),
                                                'dd.MM.yyyy',
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Income */}
                                <div className="col-3">
                                    <div className="border rounded p-4 text-center bg-success bg-opacity-10">
                                        <div className="small text-muted mb-2">
                                            wpływy
                                        </div>
                                        <div className="fs-5 fw-semibold text-success">
                                            {formatMoney(summary.total)}
                                        </div>
                                        <div className="small text-muted mt-2">
                                            <div>
                                                wizyty i sprzedaże:{' '}
                                                {formatMoney(
                                                    summary.appointments +
                                                        summary.products,
                                                )}
                                            </div>
                                            <div>
                                                napiwki:{' '}
                                                {formatMoney(summary.tips)}
                                            </div>
                                            <div>
                                                inne:{' '}
                                                {formatMoney(summary.other)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expenses */}
                                <div className="col-3">
                                    <div className="border rounded p-4 text-center bg-danger bg-opacity-10">
                                        <div className="small text-muted mb-2">
                                            wypływy
                                        </div>
                                        <div className="fs-5 fw-semibold text-danger">
                                            {formatMoney(0)}
                                        </div>
                                        <div className="small text-muted mt-2">
                                            inne: {formatMoney(0)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Other operations */}
                        <div className="mb-5">
                            <h3 className="fs-5 fw-semibold mb-3">
                                Inne operacje kasowe
                            </h3>
                            {otherOperationEntries.length > 0 ? (
                                <div className="salonbw-table-wrap">
                                    <table className="salonbw-table">
                                        <thead>
                                            <tr>
                                                <th>Czas</th>
                                                <th>Opis</th>
                                                <th className="text-end">
                                                    Kwota
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {otherOperationEntries.map(
                                                (entry) => (
                                                    <tr key={entry.id}>
                                                        <td>{entry.time}</td>
                                                        <td>
                                                            {entry.description}
                                                        </td>
                                                        <td className="text-end">
                                                            {formatMoney(
                                                                entry.amount,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-muted fst-italic">
                                    brak operacji
                                </div>
                            )}
                        </div>

                        {/* Outflows */}
                        <div className="mb-5">
                            <h3 className="fs-5 fw-semibold mb-3">
                                Wypływy z kasy
                            </h3>
                            {outflowEntries.length > 0 ? (
                                <div className="salonbw-table-wrap">
                                    <table className="salonbw-table">
                                        <thead>
                                            <tr>
                                                <th>Czas</th>
                                                <th>Typ</th>
                                                <th>Opis</th>
                                                <th className="text-end">
                                                    Kwota
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {outflowEntries.map((entry) => (
                                                <tr key={entry.id}>
                                                    <td>{entry.time}</td>
                                                    <td>
                                                        {
                                                            ENTRY_TYPE_LABELS[
                                                                entry.type
                                                            ]
                                                        }
                                                    </td>
                                                    <td>{entry.description}</td>
                                                    <td className="text-end">
                                                        {formatMoney(
                                                            entry.amount,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-muted fst-italic">
                                    brak operacji
                                </div>
                            )}
                        </div>

                        {/* Inflows */}
                        <div className="mb-5">
                            <h3 className="fs-5 fw-semibold mb-3">
                                Wpływy do kasy
                            </h3>
                            {inflowEntries.length > 0 ? (
                                <div className="salonbw-table-wrap">
                                    <table className="salonbw-table">
                                        <thead>
                                            <tr>
                                                <th>Czas</th>
                                                <th>Typ</th>
                                                <th>Opis</th>
                                                <th>Metoda płatności</th>
                                                <th className="text-end">
                                                    Kwota
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inflowEntries.map((entry) => (
                                                <tr key={entry.id}>
                                                    <td>{entry.time}</td>
                                                    <td>
                                                        {
                                                            ENTRY_TYPE_LABELS[
                                                                entry.type
                                                            ]
                                                        }
                                                    </td>
                                                    <td>{entry.description}</td>
                                                    <td>
                                                        {PAYMENT_METHOD_LABELS[
                                                            entry.paymentMethod
                                                        ] ||
                                                            entry.paymentMethod}
                                                    </td>
                                                    <td className="text-end">
                                                        {formatMoney(
                                                            entry.amount,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-muted fst-italic">
                                    brak operacji
                                </div>
                            )}
                        </div>

                        {/* Entries table */}
                        {data && data.entries.length > 0 && (
                            <div className="salonbw-table-wrap mt-5">
                                <h3 className="fs-5 fw-semibold mb-3">
                                    Szczegóły transakcji
                                </h3>
                                <table className="salonbw-table">
                                    <thead>
                                        <tr>
                                            <th>Czas</th>
                                            <th>Typ</th>
                                            <th>Opis</th>
                                            <th>Klient</th>
                                            <th>Pracownik</th>
                                            <th>Metoda płatności</th>
                                            <th>Kwota</th>
                                            <th>Napiwek</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.entries.map((entry) => (
                                            <tr key={entry.id}>
                                                <td>{entry.time}</td>
                                                <td>
                                                    {entry.type ===
                                                        'appointment' &&
                                                        'Wizyta'}
                                                    {entry.type === 'product' &&
                                                        'Produkt'}
                                                    {entry.type === 'other' &&
                                                        'Inne'}
                                                </td>
                                                <td>{entry.description}</td>
                                                <td>
                                                    {entry.customerName || '-'}
                                                </td>
                                                <td>
                                                    {entry.employeeName || '-'}
                                                </td>
                                                <td>
                                                    {entry.paymentMethod ===
                                                        'cash' && 'Gotówka'}
                                                    {entry.paymentMethod ===
                                                        'card' && 'Karta'}
                                                    {entry.paymentMethod ===
                                                        'transfer' && 'Przelew'}
                                                    {entry.paymentMethod ===
                                                        'online' && 'Online'}
                                                    {entry.paymentMethod ===
                                                        'voucher' && 'Voucher'}
                                                </td>
                                                <td className="text-end">
                                                    {formatMoney(entry.amount)}
                                                </td>
                                                <td className="text-end">
                                                    {entry.tip > 0
                                                        ? formatMoney(entry.tip)
                                                        : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="d-flex flex-column gap-4">
                        <div className="row g-4">
                            <div className="col-sm-4">
                                <div className="border rounded p-4 text-center">
                                    <div className="small text-muted mb-2">
                                        Liczba operacji
                                    </div>
                                    <div className="fs-3 fw-bold">
                                        {chronologicalEntries.length}
                                    </div>
                                </div>
                            </div>
                            <div className="col-sm-4">
                                <div className="border rounded p-4 text-center bg-success bg-opacity-10">
                                    <div className="small text-muted mb-2">
                                        Suma wpływów
                                    </div>
                                    <div className="fs-5 fw-semibold text-success">
                                        {formatMoney(
                                            inflowEntries.reduce(
                                                (sum, entry) =>
                                                    sum + entry.amount,
                                                0,
                                            ),
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="col-sm-4">
                                <div className="border rounded p-4 text-center bg-danger bg-opacity-10">
                                    <div className="small text-muted mb-2">
                                        Suma wypływów
                                    </div>
                                    <div className="fs-5 fw-semibold text-danger">
                                        {formatMoney(
                                            outflowEntries.reduce(
                                                (sum, entry) =>
                                                    sum + entry.amount,
                                                0,
                                            ),
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="salonbw-table-wrap">
                            <h3 className="fs-5 fw-semibold mb-3">
                                Historia operacji kasowych
                            </h3>
                            {paymentTotals.length > 0 ? (
                                <div className="d-flex flex-wrap gap-2 mb-3">
                                    {paymentTotals.map((item) => (
                                        <span
                                            key={item.label}
                                            className="badge bg-light text-body border"
                                        >
                                            {item.label}:{' '}
                                            {formatMoney(item.value)}
                                        </span>
                                    ))}
                                </div>
                            ) : null}
                            {chronologicalEntries.length > 0 ? (
                                <table className="salonbw-table">
                                    <thead>
                                        <tr>
                                            <th>Czas</th>
                                            <th>Typ</th>
                                            <th>Opis</th>
                                            <th>Klient</th>
                                            <th>Pracownik</th>
                                            <th>Metoda płatności</th>
                                            <th className="text-end">Kwota</th>
                                            <th className="text-end">
                                                Napiwek
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {chronologicalEntries.map((entry) => (
                                            <tr key={entry.id}>
                                                <td>{entry.time}</td>
                                                <td>
                                                    {
                                                        ENTRY_TYPE_LABELS[
                                                            entry.type
                                                        ]
                                                    }
                                                </td>
                                                <td>{entry.description}</td>
                                                <td>
                                                    {entry.customerName || '-'}
                                                </td>
                                                <td>
                                                    {entry.employeeName || '-'}
                                                </td>
                                                <td>
                                                    {PAYMENT_METHOD_LABELS[
                                                        entry.paymentMethod
                                                    ] || entry.paymentMethod}
                                                </td>
                                                <td className="text-end">
                                                    {formatMoney(entry.amount)}
                                                </td>
                                                <td className="text-end">
                                                    {entry.tip > 0
                                                        ? formatMoney(entry.tip)
                                                        : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-muted fst-italic">
                                    Brak operacji dla wybranego dnia
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </SalonShell>
    );
}
