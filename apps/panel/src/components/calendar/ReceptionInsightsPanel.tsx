interface ReceptionInsightsByActionItem {
    action: string;
    actionsTotal: number;
}

interface ReceptionInsightsByDayItem {
    day: string;
    actionsTotal: number;
    actionsOnAlerts: number;
}

interface ReceptionInsightsPanelProps {
    loading: boolean;
    error: boolean;
    actionsTotal: number | null;
    actionsOnAlerts: number | null;
    alertActionRate: number | null;
    byAction: ReceptionInsightsByActionItem[];
    byDay: ReceptionInsightsByDayItem[];
}

function formatPercent(value: number | null): string {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '—';
    }
    return `${Math.round(value)}%`;
}

export default function ReceptionInsightsPanel({
    loading,
    error,
    actionsTotal,
    actionsOnAlerts,
    alertActionRate,
    byAction,
    byDay,
}: ReceptionInsightsPanelProps) {
    const hasData =
        typeof actionsTotal === 'number' &&
        typeof actionsOnAlerts === 'number' &&
        typeof alertActionRate === 'number';

    const topActions = byAction.slice(0, 3);
    const dayTrend = byDay.slice(-7);

    return (
        <div
            className="border rounded bg-white p-2"
            data-testid="reception-insights-panel"
        >
            <div className="fw-semibold mb-2">Insights operacyjne (7 dni)</div>
            {loading ? (
                <div className="small text-muted">Ładowanie insightów...</div>
            ) : null}
            {!loading && error ? (
                <div className="small text-muted">
                    Brak danych dla wybranego zakresu.
                </div>
            ) : null}
            {!loading && !error && hasData ? (
                <div className="d-flex flex-column gap-2">
                    <div className="row row-cols-1 row-cols-md-3 g-2">
                        <div className="col">
                            <div className="border rounded p-2 h-100">
                                <div className="small text-muted">
                                    Akcje łącznie
                                </div>
                                <div className="fw-semibold">
                                    {actionsTotal}
                                </div>
                            </div>
                        </div>
                        <div className="col">
                            <div className="border rounded p-2 h-100">
                                <div className="small text-muted">
                                    Akcje na alertach
                                </div>
                                <div className="fw-semibold">
                                    {actionsOnAlerts}
                                </div>
                            </div>
                        </div>
                        <div className="col">
                            <div className="border rounded p-2 h-100">
                                <div className="small text-muted">
                                    % akcji na alertach
                                </div>
                                <div className="fw-semibold">
                                    {formatPercent(alertActionRate)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="small text-muted mb-1">Top 3 akcje</div>
                        {topActions.length === 0 ? (
                            <div className="small text-muted">Brak danych</div>
                        ) : (
                            <ul className="mb-0 ps-3">
                                {topActions.map((item) => (
                                    <li key={item.action} className="small">
                                        <span className="fw-semibold">
                                            {item.action}
                                        </span>{' '}
                                        ({item.actionsTotal})
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div>
                        <div className="small text-muted mb-1">
                            Trend dzienny (7 dni)
                        </div>
                        {dayTrend.length === 0 ? (
                            <div className="small text-muted">Brak danych</div>
                        ) : (
                            <ul className="mb-0 ps-3">
                                {dayTrend.map((item) => (
                                    <li key={item.day} className="small">
                                        <span className="fw-semibold">
                                            {item.day}
                                        </span>{' '}
                                        ({item.actionsOnAlerts}/
                                        {item.actionsTotal})
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
