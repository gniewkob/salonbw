interface ReceptionInsightsByActionItem {
    action: string;
    actionsTotal: number;
}

interface ReceptionInsightsByDayItem {
    day: string;
    actionsTotal: number;
    actionsOnAlerts: number;
}

const ACTION_LABELS: Record<string, string> = {
    open_appointment_drawer: 'otwarcie wizyty',
    confirm_appointment: 'potwierdzenie wizyty',
    start_appointment: 'rozpoczęcie wizyty',
    mark_no_show: 'oznaczenie no-show',
    finalize_via_drawer: 'finalizacja wizyty',
    open_customer_profile: 'otwarcie profilu klienta',
    open_sale_detail: 'otwarcie szczegółu sprzedaży',
};

interface ReceptionInsightsPanelProps {
    loading: boolean;
    error: boolean;
    actionsTotal: number | null;
    actionsOnAlerts: number | null;
    alertActionRate: number | null;
    byAction: ReceptionInsightsByActionItem[];
    byDay: ReceptionInsightsByDayItem[];
    onEnablePriorityFilter?: () => void;
    onEnableAlertFilter?: () => void;
    onShowToFinalize?: () => void;
    isPriorityFilterActive?: boolean;
    isAlertFilterActive?: boolean;
    isToFinalizeFilterActive?: boolean;
}

function formatPercent(value: number | null): string {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '—';
    }
    return `${Math.round(value * 100)}%`;
}

export default function ReceptionInsightsPanel({
    loading,
    error,
    actionsTotal,
    actionsOnAlerts,
    alertActionRate,
    byAction,
    byDay,
    onEnablePriorityFilter,
    onEnableAlertFilter,
    onShowToFinalize,
    isPriorityFilterActive = false,
    isAlertFilterActive = false,
    isToFinalizeFilterActive = false,
}: ReceptionInsightsPanelProps) {
    const hasData =
        typeof actionsTotal === 'number' &&
        typeof actionsOnAlerts === 'number' &&
        typeof alertActionRate === 'number';

    const topActions = byAction.slice(0, 3);
    const dayTrend = byDay.slice(-7);
    const dominantAction = topActions[0]?.action;
    const previousDay =
        dayTrend.length >= 2 ? dayTrend[dayTrend.length - 2] : null;
    const latestDay =
        dayTrend.length >= 1 ? dayTrend[dayTrend.length - 1] : null;
    const previousRate =
        previousDay && previousDay.actionsTotal > 0
            ? previousDay.actionsOnAlerts / previousDay.actionsTotal
            : null;
    const latestRate =
        latestDay && latestDay.actionsTotal > 0
            ? latestDay.actionsOnAlerts / latestDay.actionsTotal
            : null;
    const isAlertTrendRising =
        previousRate !== null &&
        latestRate !== null &&
        latestRate - previousRate >= 0.15;

    const recommendations: Array<{
        id: string;
        label: string;
        reason: string;
        cta: string;
        onClick?: () => void;
        disabled?: boolean;
    }> = [];
    const recommendationIds = new Set<string>();

    const addRecommendation = (item: {
        id: string;
        label: string;
        reason: string;
        cta: string;
        onClick?: () => void;
        disabled?: boolean;
    }) => {
        if (recommendationIds.has(item.id)) {
            return;
        }
        recommendationIds.add(item.id);
        recommendations.push(item);
    };

    if (typeof alertActionRate === 'number' && alertActionRate >= 0.5) {
        addRecommendation({
            id: 'priority',
            label: 'Wysoki udział akcji na alertach CRM.',
            reason: `${formatPercent(alertActionRate)} akcji dotyczy alertów CRM.`,
            cta: 'Włącz filtr Tylko priorytetowe',
            onClick: onEnablePriorityFilter,
            disabled: isPriorityFilterActive,
        });
    }

    if (isAlertTrendRising) {
        addRecommendation({
            id: 'alerts',
            label: 'Trend alertów CRM rośnie względem poprzedniego dnia.',
            reason: `Udział alertów wzrósł z ${formatPercent(previousRate)} do ${formatPercent(latestRate)}.`,
            cta: 'Przejdź do wizyt z alertem CRM',
            onClick: onEnableAlertFilter,
            disabled: isAlertFilterActive,
        });
    }

    if (dominantAction === 'start_appointment') {
        addRecommendation({
            id: 'finalize',
            label: 'Najczęstszą akcją jest rozpoczęcie wizyty.',
            reason: `Najczęstsza akcja: ${ACTION_LABELS[dominantAction] ?? dominantAction}.`,
            cta: 'Sprawdź wizyty do finalizacji',
            onClick: onShowToFinalize,
            disabled: isToFinalizeFilterActive,
        });
    }

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
                    <div>
                        <div className="small text-muted mb-1">
                            Co zrobić teraz
                        </div>
                        {recommendations.length === 0 ? (
                            <div className="small text-muted">
                                Brak pilnych rekomendacji.
                            </div>
                        ) : (
                            <ul className="mb-0 ps-3 d-flex flex-column gap-1">
                                {recommendations.map((item) => (
                                    <li key={item.id} className="small">
                                        <span>{item.label}</span>{' '}
                                        <span className="text-muted">
                                            {item.reason}
                                        </span>{' '}
                                        <button
                                            type="button"
                                            className="btn btn-link btn-sm p-0 align-baseline"
                                            onClick={item.onClick}
                                            disabled={item.disabled}
                                        >
                                            {item.cta}
                                        </button>
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
