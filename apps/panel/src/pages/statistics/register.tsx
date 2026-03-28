import { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useCashRegister } from '@/hooks/useStatistics';
import type { CashRegisterSummary } from '@/types';

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
                    <button type="button" className="btn btn-primary">
                        dodaj wpływ (kasa przyjmie)
                    </button>
                    <button type="button" className="btn btn-default">
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
                            <div className="text-muted fst-italic">
                                brak operacji
                            </div>
                        </div>

                        {/* Outflows */}
                        <div className="mb-5">
                            <h3 className="fs-5 fw-semibold mb-3">
                                Wypływy z kasy
                            </h3>
                            <div className="text-muted fst-italic">
                                brak operacji
                            </div>
                        </div>

                        {/* Inflows */}
                        <div className="mb-5">
                            <h3 className="fs-5 fw-semibold mb-3">
                                Wpływy do kasy
                            </h3>
                            <div className="text-muted fst-italic">
                                brak operacji
                            </div>
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
                                                    {entry.clientName || '-'}
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
                    <>
                        <h3 className="fs-5 fw-semibold mb-3">
                            Historia operacji kasowych
                        </h3>
                        <div className="text-muted fst-italic">
                            Funkcja w przygotowaniu
                        </div>
                    </>
                )}
            </div>
        </SalonShell>
    );
}
