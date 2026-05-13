import { useEffect, useMemo, useState } from 'react';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';

interface FollowUpAuditByActionItem {
    action: string;
    count: number;
}

interface FollowUpAuditByReasonItem {
    reason: string;
    count: number;
}

interface FollowUpAuditByDayItem {
    day: string;
    count: number;
}

interface FollowUpAuditResponse {
    from: string;
    to: string;
    actionsTotal: number;
    byAction: FollowUpAuditByActionItem[];
    byReason: FollowUpAuditByReasonItem[];
    byDay: FollowUpAuditByDayItem[];
}

const ACTION_LABELS: Record<string, string> = {
    contacted: 'Kontakt wykonany',
    deferred: 'Odroczono',
    dismissed: 'Pominięto',
    escalated: 'Eskalowano',
};

const REASON_LABELS: Record<string, string> = {
    recent_no_show: 'Niedawne no-show',
    stale_in_progress: 'Wizyta zbyt długo w trakcie',
    high_risk_no_contact: 'Wysokie ryzyko bez kontaktu',
};

function toDateParam(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getLast7DayRange(now: Date): { from: string; to: string } {
    const end = new Date(now);
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return { from: toDateParam(start), to: toDateParam(end) };
}

function toSafeNonNegativeNumber(value: unknown): number {
    if (typeof value !== 'number' || Number.isNaN(value)) return 0;
    return value < 0 ? 0 : value;
}

function normalizeAuditResponse(value: unknown): FollowUpAuditResponse {
    const fallback: FollowUpAuditResponse = {
        from: '',
        to: '',
        actionsTotal: 0,
        byAction: [],
        byReason: [],
        byDay: [],
    };
    if (!value || typeof value !== 'object') return fallback;

    const payload = value as Partial<FollowUpAuditResponse>;
    const actionsTotal = toSafeNonNegativeNumber(payload.actionsTotal);
    const byAction = Array.isArray(payload.byAction)
        ? payload.byAction
              .filter((item) => Boolean(item && typeof item === 'object'))
              .map((item) => ({
                  action:
                      typeof item.action === 'string' && item.action.trim()
                          ? item.action.trim()
                          : '-',
                  count: toSafeNonNegativeNumber(item.count),
              }))
        : [];

    const byReason = Array.isArray(payload.byReason)
        ? payload.byReason
              .filter((item) => Boolean(item && typeof item === 'object'))
              .map((item) => ({
                  reason:
                      typeof item.reason === 'string' && item.reason.trim()
                          ? item.reason.trim()
                          : '-',
                  count: toSafeNonNegativeNumber(item.count),
              }))
        : [];

    const byDay = Array.isArray(payload.byDay)
        ? payload.byDay
              .filter((item) => Boolean(item && typeof item === 'object'))
              .map((item) => ({
                  day:
                      typeof item.day === 'string' && item.day.trim()
                          ? item.day.trim()
                          : '-',
                  count: toSafeNonNegativeNumber(item.count),
              }))
        : [];

    return {
        from: typeof payload.from === 'string' ? payload.from : '',
        to: typeof payload.to === 'string' ? payload.to : '',
        actionsTotal,
        byAction,
        byReason,
        byDay,
    };
}

export default function FollowUpStatisticsPage() {
    const { role, apiFetch } = useAuth();
    const initialRange = useMemo(() => getLast7DayRange(new Date()), []);
    const [from, setFrom] = useState(initialRange.from);
    const [to, setTo] = useState(initialRange.to);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [summary, setSummary] = useState<FollowUpAuditResponse | null>(null);
    const [refreshToken, setRefreshToken] = useState(0);

    useEffect(() => {
        if (!role) return;
        let cancelled = false;
        setLoading(true);
        setError(false);

        void apiFetch<FollowUpAuditResponse>(
            `/crm/follow-up-actions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        )
            .then((response) => {
                if (cancelled) return;
                setSummary(normalizeAuditResponse(response));
            })
            .catch(() => {
                if (cancelled) return;
                setSummary(null);
                setError(true);
            })
            .finally(() => {
                if (cancelled) return;
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [apiFetch, from, role, to, refreshToken]);

    if (!role) return null;

    const hasData = summary !== null && !error;

    return (
        <SalonShell role={role}>
            <div className="container py-4" data-testid="follow-up-audit-page">
                <SalonBreadcrumbs
                    iconClass="i i-statistics"
                    items={[
                        { label: 'Statystyki', href: '/statistics' },
                        {
                            label: 'Audyt follow-up',
                            href: '/statistics/follow-up',
                        },
                    ]}
                />

                <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
                    <div>
                        <h1 className="h4 mb-1">Audyt follow-up CRM</h1>
                        <p className="text-muted mb-0">
                            Widok managerski aktywności follow-up.
                        </p>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                        <div>
                            <label className="form-label form-label-sm mb-1">
                                Od
                            </label>
                            <input
                                className="form-control form-control-sm"
                                type="date"
                                value={from}
                                onChange={(event) =>
                                    setFrom(event.target.value)
                                }
                            />
                        </div>
                        <div>
                            <label className="form-label form-label-sm mb-1">
                                Do
                            </label>
                            <input
                                className="form-control form-control-sm"
                                type="date"
                                value={to}
                                onChange={(event) => setTo(event.target.value)}
                            />
                        </div>
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm align-self-end"
                            onClick={() =>
                                setRefreshToken((value) => value + 1)
                            }
                        >
                            Odśwież
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="alert alert-light border">
                        Ładowanie audytu follow-up...
                    </div>
                ) : null}
                {!loading && error ? (
                    <div className="alert alert-warning">
                        Audyt follow-up chwilowo niedostępny.
                    </div>
                ) : null}
                {!loading && !error && !hasData ? (
                    <div className="alert alert-light border">
                        Brak danych dla wybranego zakresu.
                    </div>
                ) : null}

                {hasData ? (
                    <div className="d-flex flex-column gap-3">
                        <div className="row g-2">
                            <div className="col-12 col-md-4">
                                <div className="border rounded bg-white p-3 h-100">
                                    <div className="small text-muted">
                                        Akcje follow-up łącznie
                                    </div>
                                    <div className="h4 mb-0">
                                        {summary.actionsTotal}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row g-2">
                            <div className="col-12 col-lg-4">
                                <div className="border rounded bg-white p-3 h-100">
                                    <div className="fw-semibold mb-2">
                                        Podział wg akcji
                                    </div>
                                    {summary.byAction.length === 0 ? (
                                        <div className="small text-muted">
                                            Brak danych
                                        </div>
                                    ) : (
                                        <ul className="mb-0 ps-3">
                                            {summary.byAction.map((item) => (
                                                <li
                                                    key={item.action}
                                                    className="small"
                                                >
                                                    {ACTION_LABELS[
                                                        item.action
                                                    ] ?? 'Inna akcja'}{' '}
                                                    ({item.count})
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            <div className="col-12 col-lg-4">
                                <div className="border rounded bg-white p-3 h-100">
                                    <div className="fw-semibold mb-2">
                                        Podział wg powodu
                                    </div>
                                    {summary.byReason.length === 0 ? (
                                        <div className="small text-muted">
                                            Brak danych
                                        </div>
                                    ) : (
                                        <ul className="mb-0 ps-3">
                                            {summary.byReason.map((item) => (
                                                <li
                                                    key={item.reason}
                                                    className="small"
                                                >
                                                    {REASON_LABELS[
                                                        item.reason
                                                    ] ?? 'Inny powód'}{' '}
                                                    ({item.count})
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            <div className="col-12 col-lg-4">
                                <div className="border rounded bg-white p-3 h-100">
                                    <div className="fw-semibold mb-2">
                                        Trend dzienny
                                    </div>
                                    {summary.byDay.length === 0 ? (
                                        <div className="small text-muted">
                                            Brak danych
                                        </div>
                                    ) : (
                                        <ul className="mb-0 ps-3">
                                            {summary.byDay.map((item) => (
                                                <li
                                                    key={item.day}
                                                    className="small"
                                                >
                                                    {item.day} ({item.count})
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </SalonShell>
    );
}
