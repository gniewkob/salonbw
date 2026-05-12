interface ReceptionFollowUpCandidate {
    customerId: number;
    appointmentId: number | null;
    reason: 'recent_no_show' | 'stale_in_progress' | 'high_risk_no_contact';
    priority: 'critical' | 'high' | 'medium';
    suggestedAction: string;
}

type ReceptionFollowUpAction =
    | 'contacted'
    | 'deferred'
    | 'dismissed'
    | 'escalated';

type ReceptionFollowUpActionState = {
    status: 'pending' | 'success' | 'error';
    action: ReceptionFollowUpAction;
    message?: string;
};

interface ReceptionFollowUpPanelProps {
    loading: boolean;
    error: boolean;
    candidates: ReceptionFollowUpCandidate[];
    onOpenAppointment?: (appointmentId: number) => void;
    onOpenCustomer?: (customerId: number) => void;
    onCaptureFollowUpAction?: (
        candidate: ReceptionFollowUpCandidate,
        action: ReceptionFollowUpAction,
    ) => void;
    actionStateByCandidateKey?: Record<string, ReceptionFollowUpActionState>;
}

const PRIORITY_LABELS: Record<ReceptionFollowUpCandidate['priority'], string> =
    {
        critical: 'Krytyczny',
        high: 'Wysoki',
        medium: 'Średni',
    };

const PRIORITY_BADGE_CLASS: Record<
    ReceptionFollowUpCandidate['priority'],
    string
> = {
    critical: 'text-bg-danger',
    high: 'text-bg-warning',
    medium: 'text-bg-info',
};

const REASON_LABELS: Record<ReceptionFollowUpCandidate['reason'], string> = {
    recent_no_show: 'Niedawne no-show',
    stale_in_progress: 'Wizyta zbyt długo w trakcie',
    high_risk_no_contact: 'Wysokie ryzyko bez kontaktu',
};

const FOLLOW_UP_ACTION_LABELS: Record<ReceptionFollowUpAction, string> = {
    contacted: 'Oznacz kontakt',
    deferred: 'Odrocz',
    dismissed: 'Pomiń',
    escalated: 'Eskaluj',
};

const FOLLOW_UP_ACTION_RESULT_LABELS: Record<ReceptionFollowUpAction, string> =
    {
        contacted: 'Kontakt wykonany',
        deferred: 'Odroczono',
        dismissed: 'Pominięto',
        escalated: 'Wymaga eskalacji',
    };

export default function ReceptionFollowUpPanel({
    loading,
    error,
    candidates,
    onOpenAppointment,
    onOpenCustomer,
    onCaptureFollowUpAction,
    actionStateByCandidateKey,
}: ReceptionFollowUpPanelProps) {
    return (
        <div
            className="border rounded bg-white p-2"
            data-testid="reception-follow-up-panel"
        >
            <div className="fw-semibold mb-2">Kandydaci follow-up CRM</div>
            {loading ? (
                <div className="small text-muted">Ładowanie kandydatów...</div>
            ) : null}
            {!loading && error ? (
                <div className="small text-muted">
                    Kandydaci follow-up chwilowo niedostępni.
                </div>
            ) : null}
            {!loading && !error && candidates.length === 0 ? (
                <div className="small text-muted">
                    Brak kandydatów dla wybranego dnia.
                </div>
            ) : null}
            {!loading && !error && candidates.length > 0 ? (
                <ul className="list-group list-group-flush">
                    {candidates.slice(0, 5).map((candidate) => {
                        const appointmentId = candidate.appointmentId;
                        const candidateKey = `${candidate.customerId}:${candidate.reason}`;
                        const actionState =
                            actionStateByCandidateKey?.[candidateKey];
                        const isActionPending =
                            actionState?.status === 'pending';
                        const isActionHandled =
                            actionState?.status === 'success';
                        return (
                            <li
                                key={candidateKey}
                                className="list-group-item px-0 py-2"
                            >
                                <div className="d-flex justify-content-between align-items-start gap-2">
                                    <div>
                                        <div className="small fw-semibold">
                                            Klient #{candidate.customerId}
                                        </div>
                                        <div className="small text-muted">
                                            {REASON_LABELS[candidate.reason]}
                                        </div>
                                        <div className="small text-muted">
                                            Sugerowana akcja:{' '}
                                            {candidate.suggestedAction}
                                        </div>
                                    </div>
                                    <span
                                        className={`badge ${PRIORITY_BADGE_CLASS[candidate.priority]}`}
                                    >
                                        {PRIORITY_LABELS[candidate.priority]}
                                    </span>
                                </div>
                                <div className="d-flex gap-2 mt-2">
                                    {appointmentId !== null ? (
                                        <button
                                            type="button"
                                            className="btn btn-link btn-sm p-0"
                                            onClick={() =>
                                                onOpenAppointment?.(
                                                    appointmentId,
                                                )
                                            }
                                        >
                                            Otwórz wizytę #{appointmentId}
                                        </button>
                                    ) : null}
                                    <button
                                        type="button"
                                        className="btn btn-link btn-sm p-0"
                                        onClick={() =>
                                            onOpenCustomer?.(
                                                candidate.customerId,
                                            )
                                        }
                                    >
                                        Otwórz klienta
                                    </button>
                                </div>
                                <div className="d-flex flex-wrap gap-2 mt-2">
                                    {(
                                        Object.keys(
                                            FOLLOW_UP_ACTION_LABELS,
                                        ) as ReceptionFollowUpAction[]
                                    ).map((action) => (
                                        <button
                                            key={action}
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm"
                                            disabled={
                                                appointmentId === null ||
                                                isActionPending ||
                                                isActionHandled
                                            }
                                            onClick={() =>
                                                onCaptureFollowUpAction?.(
                                                    candidate,
                                                    action,
                                                )
                                            }
                                        >
                                            {FOLLOW_UP_ACTION_LABELS[action]}
                                        </button>
                                    ))}
                                </div>
                                {actionState?.status === 'success' ? (
                                    <div className="small text-success mt-2">
                                        Wykonano:{' '}
                                        {
                                            FOLLOW_UP_ACTION_RESULT_LABELS[
                                                actionState.action
                                            ]
                                        }
                                    </div>
                                ) : null}
                                {actionState?.status === 'error' ? (
                                    <div className="small text-danger mt-2">
                                        {actionState.message ??
                                            'Nie udało się zapisać akcji follow-up.'}
                                    </div>
                                ) : null}
                                {appointmentId === null ? (
                                    <div className="small text-muted mt-2">
                                        Akcje follow-up niedostępne bez
                                        powiązanej wizyty.
                                    </div>
                                ) : null}
                            </li>
                        );
                    })}
                </ul>
            ) : null}
        </div>
    );
}
