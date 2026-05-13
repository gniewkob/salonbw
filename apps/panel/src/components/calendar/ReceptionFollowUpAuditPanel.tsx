interface FollowUpByActionItem {
    action: string;
    count: number;
}

interface FollowUpByReasonItem {
    reason: string;
    count: number;
}

interface FollowUpByDayItem {
    day: string;
    count: number;
}

interface ReceptionFollowUpAuditPanelProps {
    loading: boolean;
    error: boolean;
    actionsTotal: number | null;
    byAction: FollowUpByActionItem[];
    byReason: FollowUpByReasonItem[];
    byDay: FollowUpByDayItem[];
}

const ACTION_LABELS: Record<string, string> = {
    contacted: 'Kontakt wykonany',
    deferred: 'Odroczono',
    dismissed: 'Pominięto',
    escalated: 'Eskalowano',
};
const UNKNOWN_ACTION_LABEL = 'Inna akcja';

const REASON_LABELS: Record<string, string> = {
    recent_no_show: 'Niedawne no-show',
    stale_in_progress: 'Wizyta zbyt długo w trakcie',
    high_risk_no_contact: 'Wysokie ryzyko bez kontaktu',
};
const UNKNOWN_REASON_LABEL = 'Inny powód';

export default function ReceptionFollowUpAuditPanel({
    loading,
    error,
    actionsTotal,
    byAction,
    byReason,
    byDay,
}: ReceptionFollowUpAuditPanelProps) {
    const hasData = typeof actionsTotal === 'number';

    return (
        <div
            className="border rounded bg-white p-2"
            data-testid="reception-follow-up-audit-panel"
        >
            <div className="fw-semibold mb-2">Audyt follow-up (7 dni)</div>
            {loading ? (
                <div className="small text-muted">Ładowanie audytu...</div>
            ) : null}
            {!loading && error ? (
                <div className="small text-muted">
                    Audyt follow-up chwilowo niedostępny.
                </div>
            ) : null}
            {!loading && !error && hasData ? (
                <div className="d-flex flex-column gap-2">
                    <div className="border rounded p-2">
                        <div className="small text-muted">
                            Akcje follow-up łącznie
                        </div>
                        <div className="fw-semibold">{actionsTotal}</div>
                    </div>
                    <div>
                        <div className="small text-muted mb-1">
                            Podział wg akcji
                        </div>
                        {byAction.length === 0 ? (
                            <div className="small text-muted">Brak danych</div>
                        ) : (
                            <ul className="mb-0 ps-3">
                                {byAction.slice(0, 4).map((item) => (
                                    <li key={item.action} className="small">
                                        <span className="fw-semibold">
                                            {ACTION_LABELS[item.action] ??
                                                UNKNOWN_ACTION_LABEL}
                                        </span>{' '}
                                        ({item.count})
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div>
                        <div className="small text-muted mb-1">
                            Podział wg powodu
                        </div>
                        {byReason.length === 0 ? (
                            <div className="small text-muted">Brak danych</div>
                        ) : (
                            <ul className="mb-0 ps-3">
                                {byReason.slice(0, 4).map((item) => (
                                    <li key={item.reason} className="small">
                                        <span className="fw-semibold">
                                            {REASON_LABELS[item.reason] ??
                                                UNKNOWN_REASON_LABEL}
                                        </span>{' '}
                                        ({item.count})
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div>
                        <div className="small text-muted mb-1">
                            Trend dzienny
                        </div>
                        {byDay.length === 0 ? (
                            <div className="small text-muted">Brak danych</div>
                        ) : (
                            <ul className="mb-0 ps-3">
                                {byDay.slice(-7).map((item) => (
                                    <li key={item.day} className="small">
                                        <span className="fw-semibold">
                                            {item.day}
                                        </span>{' '}
                                        ({item.count})
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
