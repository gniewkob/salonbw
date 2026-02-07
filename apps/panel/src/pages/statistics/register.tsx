import { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';
import { useCashRegister } from '@/hooks/useStatistics';

interface CashRegisterEntry {
    id: number;
    time: string;
    type: 'appointment' | 'product' | 'other';
    description: string;
    paymentMethod: string;
    amount: number;
    tip: number;
    employeeName: string | null;
    clientName: string | null;
}

interface CashRegisterSummary {
    date: string;
    entries: CashRegisterEntry[];
    totals: {
        cash: number;
        card: number;
        transfer: number;
        online: number;
        voucher: number;
        total: number;
        tips: number;
    };
}

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
    const calculateSummary = (entries: CashRegisterEntry[]) => {
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
        <VersumShell role={role}>
            <div className="versum-page" data-testid="cash-register-page">
                <header className="versum-page__header">
                    <h1 className="versum-page__title">
                        Statystyki / Stan kasy
                    </h1>
                </header>

                <div className="versum-page__toolbar">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="versum-toolbar-btn btn btn-default"
                            onClick={() => navigateDate('prev')}
                        >
                            ◀
                        </button>
                        <input
                            type="date"
                            className="form-control versum-toolbar-search"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                        <button
                            type="button"
                            className="versum-toolbar-btn btn btn-default"
                            onClick={() => navigateDate('next')}
                        >
                            ▶
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-4 border-bottom">
                    <div className="nav-tabs" style={{ borderBottom: 'none' }}>
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
                <div className="p-4 flex gap-2 justify-center">
                    <button type="button" className="btn btn-primary">
                        dodaj wpływ (kasa przyjmie)
                    </button>
                    <button type="button" className="btn btn-default">
                        dodaj wypływ (kasa wypłaci)
                    </button>
                </div>

                {isLoading ? (
                    <div className="p-4 text-sm versum-muted">Ładowanie...</div>
                ) : activeTab === 'register' ? (
                    <div className="inner">
                        {/* Status header */}
                        <div className="flex items-center gap-3 mb-4">
                            <h2 className="text-xl font-normal">
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
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                {/* Current balance */}
                                <div className="border rounded p-4 text-center bg-blue-50">
                                    <div className="text-sm text-gray-600 mb-2">
                                        aktualny stan kasy
                                    </div>
                                    <div className="text-2xl font-bold text-blue-600">
                                        {formatMoney(
                                            data.totals.total + summary.tips,
                                        )}
                                    </div>
                                </div>

                                {/* Initial balance */}
                                <div className="border rounded p-4 text-center">
                                    <div className="text-sm text-gray-600 mb-2">
                                        stan początkowy
                                    </div>
                                    <div className="text-xl font-semibold">
                                        {formatMoney(0)}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        na dzień:{' '}
                                        {format(
                                            new Date(selectedDate),
                                            'dd.MM.yyyy',
                                        )}
                                    </div>
                                </div>

                                {/* Income */}
                                <div className="border rounded p-4 text-center bg-green-50">
                                    <div className="text-sm text-gray-600 mb-2">
                                        wpływy
                                    </div>
                                    <div className="text-xl font-semibold text-green-700">
                                        {formatMoney(summary.total)}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                                        <div>
                                            wizyty i sprzedaże:{' '}
                                            {formatMoney(
                                                summary.appointments +
                                                    summary.products,
                                            )}
                                        </div>
                                        <div>
                                            napiwki: {formatMoney(summary.tips)}
                                        </div>
                                        <div>
                                            inne: {formatMoney(summary.other)}
                                        </div>
                                    </div>
                                </div>

                                {/* Expenses */}
                                <div className="border rounded p-4 text-center bg-red-50">
                                    <div className="text-sm text-gray-600 mb-2">
                                        wypływy
                                    </div>
                                    <div className="text-xl font-semibold text-red-700">
                                        {formatMoney(0)}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                        inne: {formatMoney(0)}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Other operations */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3">
                                Inne operacje kasowe
                            </h3>
                            <div className="text-gray-500 italic">
                                brak operacji
                            </div>
                        </div>

                        {/* Outflows */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3">
                                Wypływy z kasy
                            </h3>
                            <div className="text-gray-500 italic">
                                brak operacji
                            </div>
                        </div>

                        {/* Inflows */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3">
                                Wpływy do kasy
                            </h3>
                            <div className="text-gray-500 italic">
                                brak operacji
                            </div>
                        </div>

                        {/* Entries table */}
                        {data && data.entries.length > 0 && (
                            <div className="versum-table-wrap mt-6">
                                <h3 className="text-lg font-semibold mb-3">
                                    Szczegóły transakcji
                                </h3>
                                <table className="versum-table">
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
                                                <td className="text-right">
                                                    {formatMoney(entry.amount)}
                                                </td>
                                                <td className="text-right">
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
                    </div>
                ) : (
                    <div className="inner">
                        <h3 className="text-lg font-semibold mb-3">
                            Historia operacji kasowych
                        </h3>
                        <div className="text-gray-500 italic">
                            Funkcja w przygotowaniu
                        </div>
                    </div>
                )}
            </div>
        </VersumShell>
    );
}
