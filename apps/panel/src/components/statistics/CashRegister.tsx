'use client';

import type { CashRegisterSummary } from '@/types';

interface Props {
    data: CashRegisterSummary | null;
    loading?: boolean;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    cash: 'Gotówka',
    card: 'Karta',
    transfer: 'Przelew',
    online: 'Online',
    voucher: 'Voucher',
};

export default function CashRegister({ data, loading }: Props) {
    if (loading) {
        return (
            <div className="d-flex align-items-center justify-content-center py-5">
                <div className="rounded-circle h-6 w-6 border-bottom-2 border-primary"></div>
            </div>
        );
    }

    if (!data || data.entries.length === 0) {
        return (
            <div className="text-center py-5 text-muted">
                Brak transakcji w wybranym dniu
            </div>
        );
    }

    return (
        <div className="gap-3">
            {/* Summary cards */}
            <div className="-cols-2 gap-3">
                <div className="bg-success bg-opacity-10 border border-success rounded-3 p-3">
                    <p className="small text-success fw-medium">Suma</p>
                    <p className="fs-3 fw-bold text-success">
                        {data.totals.total.toLocaleString('pl-PL')} PLN
                    </p>
                </div>
                <div className="bg-primary bg-opacity-10 border border-primary rounded-3 p-3">
                    <p className="small text-primary fw-medium">Gotówka</p>
                    <p className="fs-5 fw-bold text-primary">
                        {data.totals.cash.toLocaleString('pl-PL')} PLN
                    </p>
                </div>
                <div className="bg-info bg-opacity-10 border border-purple-100 rounded-3 p-3">
                    <p className="small text-info fw-medium">Karta</p>
                    <p className="fs-5 fw-bold text-info">
                        {data.totals.card.toLocaleString('pl-PL')} PLN
                    </p>
                </div>
                <div className="bg-warning bg-opacity-10 border border-yellow-100 rounded-3 p-3">
                    <p className="small text-warning fw-medium">Napiwki</p>
                    <p className="fs-5 fw-bold text-warning">
                        {data.totals.tips.toLocaleString('pl-PL')} PLN
                    </p>
                </div>
            </div>

            {/* Entries table */}
            <div className="overflow-x-auto">
                <table className="min-w-100">
                    <thead className="bg-light">
                        <tr>
                            <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                                Godzina
                            </th>
                            <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                                Opis
                            </th>
                            <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                                Klient
                            </th>
                            <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                                Pracownik
                            </th>
                            <th className="px-3 py-2 text-start small fw-medium text-muted text-uppercase">
                                Płatność
                            </th>
                            <th className="px-3 py-2 text-end small fw-medium text-muted text-uppercase">
                                Kwota
                            </th>
                            <th className="px-3 py-2 text-end small fw-medium text-muted text-uppercase">
                                Napiwek
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {data.entries.map((entry) => (
                            <tr key={entry.id} className="">
                                <td className="px-3 py-2 text-nowrap small text-muted">
                                    {entry.time}
                                </td>
                                <td className="px-3 py-2 text-nowrap">
                                    <span className="fw-medium text-dark">
                                        {entry.description}
                                    </span>
                                </td>
                                <td className="px-3 py-2 text-nowrap small text-muted">
                                    {entry.clientName || '-'}
                                </td>
                                <td className="px-3 py-2 text-nowrap small text-muted">
                                    {entry.employeeName || '-'}
                                </td>
                                <td className="px-3 py-2 text-nowrap">
                                    <span
                                        className={`px-2 py-1 small rounded-circle ${
                                            entry.paymentMethod === 'cash'
                                                ? 'bg-success bg-opacity-10 text-success'
                                                : entry.paymentMethod === 'card'
                                                  ? 'bg-info bg-opacity-10 text-info'
                                                  : 'bg-light text-body'
                                        }`}
                                    >
                                        {PAYMENT_METHOD_LABELS[
                                            entry.paymentMethod
                                        ] || entry.paymentMethod}
                                    </span>
                                </td>
                                <td className="px-3 py-2 text-nowrap text-end">
                                    <span className="fw-semibold text-dark">
                                        {entry.amount.toLocaleString('pl-PL')}{' '}
                                        PLN
                                    </span>
                                </td>
                                <td className="px-3 py-2 text-nowrap text-end">
                                    {entry.tip > 0 ? (
                                        <span className="text-success">
                                            +{entry.tip.toLocaleString('pl-PL')}{' '}
                                            PLN
                                        </span>
                                    ) : (
                                        <span className="text-secondary">
                                            -
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-light">
                        <tr>
                            <td
                                colSpan={5}
                                className="px-3 py-2 text-end fw-medium text-body"
                            >
                                Suma:
                            </td>
                            <td className="px-3 py-2 text-end fw-bold text-dark">
                                {data.totals.total.toLocaleString('pl-PL')} PLN
                            </td>
                            <td className="px-3 py-2 text-end fw-bold text-success">
                                {data.totals.tips > 0
                                    ? `+${data.totals.tips.toLocaleString('pl-PL')} PLN`
                                    : '-'}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
