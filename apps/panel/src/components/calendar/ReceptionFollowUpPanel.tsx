interface ReceptionFollowUpCandidate {
    customerId: number;
    appointmentId: number | null;
    reason: 'recent_no_show' | 'stale_in_progress' | 'high_risk_no_contact';
    priority: 'critical' | 'high' | 'medium';
    suggestedAction: string;
}

interface ReceptionFollowUpPanelProps {
    loading: boolean;
    error: boolean;
    candidates: ReceptionFollowUpCandidate[];
    onOpenAppointment?: (appointmentId: number) => void;
    onOpenCustomer?: (customerId: number) => void;
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

export default function ReceptionFollowUpPanel({
    loading,
    error,
    candidates,
    onOpenAppointment,
    onOpenCustomer,
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
                        return (
                            <li
                                key={`${candidate.customerId}:${candidate.reason}`}
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
                            </li>
                        );
                    })}
                </ul>
            ) : null}
        </div>
    );
}
