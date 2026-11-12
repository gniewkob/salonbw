import { useState } from 'react';
import {
    CHANNEL_LABELS,
    CommunicationScope,
    ConsentHistoryItem,
    SOURCE_LABELS,
} from '@/api/communicationConsents';
import {
    useCommunicationCatalog,
    useConsentHistory,
} from '@/hooks/useCommunicationConsents';

export interface CustomerConsentHistoryProps {
    scope: CommunicationScope;
    audience: 'staff' | 'customer';
    pageSize?: number;
}

const EVENT_LABELS: Record<ConsentHistoryItem['eventType'], string> = {
    GRANTED: 'Udzielono zgody',
    WITHDRAWN: 'Wycofano zgodę',
    PREFERENCE_ENABLED: 'Włączono',
    PREFERENCE_DISABLED: 'Wyłączono',
};

/** Audited history only — never renders placeholder or synthetic events. */
export default function CustomerConsentHistory({
    scope,
    audience,
    pageSize = 20,
}: CustomerConsentHistoryProps) {
    const [page, setPage] = useState(1);
    const history = useConsentHistory(scope, page, pageSize);
    const catalog = useCommunicationCatalog();

    const subject = (item: ConsentHistoryItem) => {
        if (item.purpose) {
            return (
                catalog.data?.consentScopes.find(
                    (s) =>
                        s.purpose === item.purpose &&
                        s.channel === item.channel,
                )?.label ?? `${item.purpose} — ${CHANNEL_LABELS[item.channel]}`
            );
        }
        const type = catalog.data?.types.find(
            (t) => t.type === item.communicationType,
        );
        return `${type?.label ?? item.communicationType} — ${CHANNEL_LABELS[item.channel]}`;
    };

    if (history.isLoading) {
        return <p className="text-muted small">Ładowanie historii…</p>;
    }
    if (history.isError || !history.data) {
        return (
            <p className="text-danger small" role="alert">
                Nie udało się pobrać historii zgód.
            </p>
        );
    }
    const { items, total, legacyItems } = history.data;
    const pages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div data-testid="consent-history">
            {items.length === 0 ? (
                <p className="text-muted small">
                    Brak zapisanych zmian zgód i preferencji.
                </p>
            ) : (
                <table className="customer-communication-table customer-communication-history-table">
                    <thead>
                        <tr>
                            <th scope="col">Data</th>
                            <th scope="col">Zmiana</th>
                            <th scope="col">Zakres</th>
                            <th scope="col">Źródło</th>
                            {audience === 'staff' && (
                                <>
                                    <th scope="col">Wykonał</th>
                                    <th scope="col">Dowód</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id} data-event={item.eventType}>
                                <td>
                                    {new Date(item.occurredAt).toLocaleString(
                                        'pl-PL',
                                    )}
                                </td>
                                <td>
                                    {EVENT_LABELS[item.eventType]}
                                    {item.previousStatus && (
                                        <small className="text-muted d-block">
                                            {item.previousStatus} →{' '}
                                            {item.newStatus}
                                        </small>
                                    )}
                                </td>
                                <td>{subject(item)}</td>
                                <td>
                                    {SOURCE_LABELS[item.source] ?? item.source}
                                    {item.consentTextVersion && (
                                        <small className="text-muted d-block">
                                            treść {item.consentTextVersion}
                                        </small>
                                    )}
                                </td>
                                {audience === 'staff' && (
                                    <>
                                        <td>
                                            {item.performedBySelf
                                                ? 'Klient'
                                                : (item.actorName ??
                                                  item.actorRole)}
                                        </td>
                                        <td>{item.evidenceReference ?? '—'}</td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {pages > 1 && (
                <nav
                    aria-label="Paginacja historii zgód"
                    className="d-flex gap-2 mt-2"
                >
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        Poprzednia
                    </button>
                    <span className="small align-self-center">
                        {page} / {pages}
                    </span>
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        disabled={page >= pages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Następna
                    </button>
                </nav>
            )}
            {audience === 'staff' && legacyItems.length > 0 && (
                <details className="mt-2 small">
                    <summary>
                        Wcześniejsze wpisy z dziennika (bez pełnego audytu)
                    </summary>
                    <ul className="mb-0">
                        {legacyItems.map((l) => (
                            <li key={l.id}>
                                {new Date(l.timestamp).toLocaleString('pl-PL')}{' '}
                                — {l.field}: {String(l.previous)} →{' '}
                                {String(l.current)}
                            </li>
                        ))}
                    </ul>
                </details>
            )}
        </div>
    );
}
