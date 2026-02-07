import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';
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
    const { role } = useAuth();
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const { data, loading } = useSmsHistory({
        page,
        limit: 20,
        status: status || undefined,
    });

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:communication">
            <VersumShell role={role}>
                <div className="versum-page" data-testid="communication-page">
                    <header className="versum-page__header">
                        <h1 className="versum-page__title">
                            Łączność / Nieprzeczytane wiadomości
                        </h1>
                        <div className="flex gap-2">
                            <Link
                                href="/communication/templates"
                                className="versum-btn versum-btn--light"
                            >
                                Szablony
                            </Link>
                            <Link
                                href="/communication/reminders"
                                className="versum-btn versum-btn--light"
                            >
                                Przypomnienia
                            </Link>
                            <button
                                type="button"
                                className="versum-btn versum-btn--default"
                            >
                                wyślij wiadomość pojedynczą
                            </button>
                            <Link
                                href="/communication/mass"
                                className="versum-btn versum-btn--primary"
                            >
                                wyślij wiadomość masową
                            </Link>
                        </div>
                    </header>

                    <div className="versum-page__toolbar">
                        <label className="versum-label">
                            Status:
                            <select
                                className="versum-select ml-2"
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
                        <label className="versum-label">
                            Rodzaj:
                            <select
                                className="versum-select ml-2"
                                defaultValue="all"
                            >
                                <option value="all">SMS i email</option>
                                <option value="sms">SMS</option>
                                <option value="email">Email</option>
                            </select>
                        </label>
                    </div>

                    {loading ? (
                        <div className="versum-loading">
                            Ładowanie wiadomości...
                        </div>
                    ) : data ? (
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
                                                    <div className="versum-muted text-xs mt-1">
                                                        {entry.content.slice(
                                                            0,
                                                            120,
                                                        )}
                                                        {entry.content.length >
                                                        120
                                                            ? '...'
                                                            : ''}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="versum-badge versum-badge--info">
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

                            <div className="versum-pagination">
                                <span className="versum-pagination__info">
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
                                        className="versum-btn versum-btn--sm versum-btn--light"
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
                                        className="versum-btn versum-btn--sm versum-btn--light"
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
                    ) : (
                        <div className="versum-empty">Brak wiadomości</div>
                    )}
                </div>
            </VersumShell>
        </RouteGuard>
    );
}
