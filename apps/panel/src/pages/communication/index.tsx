import { useState } from 'react';
import { format } from 'date-fns';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { useSmsHistory } from '@/hooks/useSms';

function formatDateTime(value?: string) {
    if (!value) return '-';
    try {
        return format(new Date(value), 'd MMM, HH:mm');
    } catch {
        return '-';
    }
}

export default function CommunicationPage() {
    return <CommunicationPageContent />;
}

function CommunicationPageContent() {
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const { data, loading } = useSmsHistory({
        page,
        limit: 20,
        status: status || undefined,
    });

    return (
        <RouteGuard roles={['admin']} permission="nav:communication">
            <DashboardLayout>
                <div className="versum-page" data-testid="communication-page">
                    <header className="versum-page__header">
                        <h1 className="versum-page__title">
                            Łączność / Nieprzeczytane wiadomości
                        </h1>
                        <div className="flex gap-2">
                            <button type="button" className="versum-button">
                                wyślij wiadomość pojedynczą
                            </button>
                            <button type="button" className="versum-button">
                                wyślij wiadomość masową
                            </button>
                        </div>
                    </header>

                    <div className="versum-page__toolbar">
                        <label className="text-xs text-gray-600">
                            Status:
                            <select
                                className="versum-select ml-1"
                                value={status}
                                onChange={(event) => {
                                    setStatus(event.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="">
                                    odczytane i nieodczytane
                                </option>
                                <option value="sent">wysłane</option>
                                <option value="delivered">dostarczone</option>
                                <option value="failed">nieudane</option>
                            </select>
                        </label>
                        <label className="text-xs text-gray-600">
                            Rodzaj:
                            <select
                                className="versum-select ml-1"
                                defaultValue="all"
                            >
                                <option value="all">SMS i email</option>
                                <option value="sms">SMS</option>
                                <option value="email">Email</option>
                            </select>
                        </label>
                    </div>

                    {loading ? (
                        <div className="p-4 text-sm versum-muted">
                            Ładowanie wiadomości...
                        </div>
                    ) : (
                        <>
                            <div className="versum-table-wrap">
                                <table className="versum-table">
                                    <thead>
                                        <tr>
                                            <th>Odbiorca</th>
                                            <th>Wiadomość</th>
                                            <th>Rodzaj</th>
                                            <th>Wysłano</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.items.map((entry) => (
                                            <tr key={entry.id}>
                                                <td>{entry.recipient}</td>
                                                <td>
                                                    <strong>
                                                        {entry.subject ||
                                                            'Wiadomość'}
                                                    </strong>
                                                    <div className="versum-muted text-xs">
                                                        {entry.content.slice(
                                                            0,
                                                            120,
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="rounded bg-sky-100 px-2 py-1 text-xs text-sky-700">
                                                        {entry.channel}
                                                    </span>
                                                </td>
                                                <td>
                                                    {formatDateTime(
                                                        entry.sentAt ||
                                                            entry.createdAt,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-300 bg-white px-3 py-2 text-xs text-gray-600">
                                <span>
                                    Pozycje{' '}
                                    {Math.min(
                                        (page - 1) * data.limit + 1,
                                        data.total,
                                    )}{' '}
                                    - {Math.min(page * data.limit, data.total)}{' '}
                                    z {data.total}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className="versum-button versum-button--light"
                                        disabled={page <= 1}
                                        onClick={() =>
                                            setPage((current) =>
                                                Math.max(1, current - 1),
                                            )
                                        }
                                    >
                                        poprzednia
                                    </button>
                                    <button
                                        type="button"
                                        className="versum-button versum-button--light"
                                        disabled={
                                            page * data.limit >= data.total
                                        }
                                        onClick={() =>
                                            setPage((current) => current + 1)
                                        }
                                    >
                                        następna
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </DashboardLayout>
        </RouteGuard>
    );
}
