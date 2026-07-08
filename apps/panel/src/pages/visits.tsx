import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import ConfirmModal from '@/components/ConfirmModal';
import ClientAppointmentActions, {
    CLIENT_ARCHIVE_STATUSES,
    CLIENT_CANCELLABLE_STATUSES,
} from '@/components/client/ClientAppointmentActions';
import ClientPageHeader from '@/components/client/ClientPageHeader';
import ClientPanelSection from '@/components/client/ClientPanelSection';
import RescheduleChangeNotice from '@/components/client/RescheduleChangeNotice';
import VisitNotes from '@/components/client/VisitNotes';
import StarRating from '@/components/StarRating';
import MessageThread from '@/components/messages/MessageThread';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import PanelButton from '@/components/ui/PanelButton';

interface ClientVisit {
    id: number;
    startTime: string;
    endTime: string;
    reschedulePreviousStartTime?: string | null;
    reschedulePreviousEndTime?: string | null;
    status: string;
    serviceId: number;
    serviceName: string;
    employeeName: string;
    notes: string | null;
    clientComment?: string | null;
    staffRecommendations?: string | null;
    onlineAddonsSummary?: string | null;
    onlineTotalDurationMinutes?: number | null;
    onlineDurationNeedsVerification?: boolean;
    review: { id: number; rating: number; comment: string | null } | null;
}

function formatDateTime(value: string) {
    return new Date(value).toLocaleString('pl-PL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function hasClientVisibleVisitNotes(visit: ClientVisit) {
    return Boolean(
        visit.notes?.trim() ||
            visit.clientComment?.trim() ||
            visit.staffRecommendations?.trim() ||
            visit.onlineAddonsSummary?.trim() ||
            visit.onlineTotalDurationMinutes ||
            visit.onlineDurationNeedsVerification,
    );
}

function isPastUnresolvedVisit(visit: ClientVisit, isFuture: boolean) {
    return !isFuture && !CLIENT_ARCHIVE_STATUSES.has(visit.status);
}

interface ReviewFormProps {
    visit: ClientVisit;
    onSaved: () => void;
}

function ReviewForm({ visit, onSaved }: ReviewFormProps) {
    const { apiFetch } = useAuth();
    const toast = useToast();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        if (rating < 1) {
            toast.error('Wybierz liczbę gwiazdek (1–5).');
            return;
        }
        setSaving(true);
        try {
            await apiFetch('/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointmentId: visit.id,
                    rating,
                    ...(comment.trim() ? { comment: comment.trim() } : {}),
                }),
            });
            toast.success('Dziękujemy za ocenę!');
            onSaved();
        } catch {
            toast.error('Nie udało się zapisać oceny. Spróbuj ponownie.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mt-2">
            <div className="salonbw-appointment-item__actions">
                <span className="small text-muted">Oceń wizytę:</span>
                <StarRating value={rating} onChange={setRating} />
            </div>
            <div className="d-flex align-items-start gap-2 mt-1 flex-wrap">
                <label
                    htmlFor={`review-comment-${visit.id}`}
                    className="visually-hidden"
                >
                    Komentarz do wizyty
                </label>
                <textarea
                    id={`review-comment-${visit.id}`}
                    className="form-control form-control-sm visits-review__comment"
                    rows={2}
                    maxLength={1000}
                    placeholder="Komentarz (opcjonalnie)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />
                <PanelButton
                    type="button"
                    size="sm"
                    variant="primary"
                    disabled={saving || rating < 1}
                    aria-busy={saving}
                    onClick={() => void submit()}
                >
                    {saving ? 'Zapisywanie…' : 'Zapisz ocenę'}
                </PanelButton>
            </div>
        </div>
    );
}

function VisitRow({
    visit,
    onCancel,
    onAccept,
    onOpen,
    onRefetch,
    expanded,
    cancelling,
    accepting,
}: {
    visit: ClientVisit;
    onCancel: (id: number) => void;
    onAccept: (id: number) => void;
    onOpen: (id: number) => void;
    onRefetch: () => void;
    expanded: boolean;
    cancelling: boolean;
    accepting: boolean;
}) {
    const { apiFetch } = useAuth();
    const toast = useToast();
    const [changingReview, setChangingReview] = useState(false);
    const [messagesOpen, setMessagesOpen] = useState(false);

    const removeReview = async () => {
        if (!visit.review) return;
        try {
            await apiFetch(`/reviews/${visit.review.id}`, {
                method: 'DELETE',
            });
            setChangingReview(true);
            onRefetch();
        } catch {
            toast.error('Nie udało się usunąć oceny. Spróbuj ponownie.');
        }
    };

    const isCompleted = visit.status === 'completed';
    const isFuture = new Date(visit.startTime).getTime() > Date.now();
    const isPastUnresolved = isPastUnresolvedVisit(visit, isFuture);
    const displayStatus = isPastUnresolved ? 'no_show' : visit.status;
    const canAskForNewTime =
        isFuture && !CLIENT_ARCHIVE_STATUSES.has(visit.status);

    return (
        <div
            id={`visit-${visit.id}`}
            className={[
                'salonbw-appointment-item',
                expanded ? 'salonbw-appointment-item--expanded' : '',
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <div className="salonbw-appointment-item__details">
                <button
                    type="button"
                    className="salonbw-appointment-item__title-button"
                    onClick={() => onOpen(visit.id)}
                >
                    {visit.serviceName}
                </button>
                <div className="salonbw-appointment-item__service text-muted small">
                    {formatDateTime(visit.startTime)}
                </div>
                {visit.employeeName && (
                    <div className="salonbw-appointment-item__service text-muted small">
                        specjalista: {visit.employeeName}
                    </div>
                )}
                {hasClientVisibleVisitNotes(visit) && (
                    <VisitNotes
                        notes={visit.notes}
                        compact
                        appointmentStatus={visit.status}
                        clientComment={visit.clientComment}
                        staffRecommendations={visit.staffRecommendations}
                        onlineAddonsSummary={visit.onlineAddonsSummary}
                        onlineTotalDurationMinutes={
                            visit.onlineTotalDurationMinutes
                        }
                        onlineDurationNeedsVerification={
                            visit.onlineDurationNeedsVerification
                        }
                    />
                )}
                {visit.status === 'rescheduled_pending' && (
                    <RescheduleChangeNotice
                        previousStartTime={visit.reschedulePreviousStartTime}
                        newStartTime={visit.startTime}
                    />
                )}
                {isCompleted && visit.review && !changingReview && (
                    <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                        <StarRating value={visit.review.rating} size="sm" />
                        {visit.review.comment && (
                            <span className="small text-muted">
                                „{visit.review.comment}&rdquo;
                            </span>
                        )}
                        <button
                            type="button"
                            className="btn btn-link btn-sm p-0"
                            onClick={() => void removeReview()}
                        >
                            Zmień ocenę
                        </button>
                    </div>
                )}
                {isCompleted && (!visit.review || changingReview) && (
                    <ReviewForm
                        visit={visit}
                        onSaved={() => {
                            setChangingReview(false);
                            onRefetch();
                        }}
                    />
                )}
            </div>
            <ClientAppointmentActions
                status={displayStatus}
                serviceId={visit.serviceId}
                accepting={accepting}
                cancelling={cancelling}
                canAccept={isFuture && visit.status === 'rescheduled_pending'}
                canCancel={
                    isFuture && CLIENT_CANCELLABLE_STATUSES.has(visit.status)
                }
                showRebook={
                    CLIENT_ARCHIVE_STATUSES.has(visit.status) ||
                    isPastUnresolved
                }
                onAccept={() => onAccept(visit.id)}
                onCancel={() => onCancel(visit.id)}
            />

            <PanelButton
                type="button"
                size="sm"
                variant="ghost"
                aria-expanded={expanded}
                aria-controls={`visit-details-${visit.id}`}
                onClick={() => onOpen(visit.id)}
            >
                {expanded ? 'Zwiń' : 'Szczegóły'}
            </PanelButton>

            <div className="salonbw-appointment-item__messages">
                {expanded && (
                    <div
                        id={`visit-details-${visit.id}`}
                        className="salonbw-appointment-item__message-panel"
                    >
                        <div className="visit-details-grid">
                            <div>
                                <div className="visit-details-label">
                                    Notatki i zalecenia
                                </div>
                                <VisitNotes
                                    notes={visit.notes}
                                    appointmentStatus={visit.status}
                                    clientComment={visit.clientComment}
                                    staffRecommendations={
                                        visit.staffRecommendations
                                    }
                                    onlineAddonsSummary={
                                        visit.onlineAddonsSummary
                                    }
                                    onlineTotalDurationMinutes={
                                        visit.onlineTotalDurationMinutes
                                    }
                                    onlineDurationNeedsVerification={
                                        visit.onlineDurationNeedsVerification
                                    }
                                />
                            </div>
                            <div>
                                <div className="visit-details-label">
                                    Co możesz zrobić
                                </div>
                                <div className="visit-details-actions">
                                    {canAskForNewTime ? (
                                        <PanelButton
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            onClick={() =>
                                                setMessagesOpen(true)
                                            }
                                        >
                                            Poproś o zmianę terminu
                                        </PanelButton>
                                    ) : null}
                                    {CLIENT_ARCHIVE_STATUSES.has(
                                        visit.status,
                                    ) ? (
                                        <PanelButton
                                            href={`/booking?serviceId=${visit.serviceId}`}
                                            size="sm"
                                            variant="secondary"
                                        >
                                            Umów ponownie
                                        </PanelButton>
                                    ) : null}
                                    <PanelButton
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        aria-expanded={messagesOpen}
                                        aria-controls={`messages-panel-${visit.id}`}
                                        onClick={() =>
                                            setMessagesOpen((v) => !v)
                                        }
                                    >
                                        {messagesOpen
                                            ? 'Ukryj wiadomości'
                                            : 'Dodaj wiadomość'}
                                    </PanelButton>
                                </div>
                            </div>
                        </div>
                        {canAskForNewTime && messagesOpen ? (
                            <p className="visit-details-hint">
                                Napisz, jaki dzień lub zakres godzin pasuje Ci
                                lepiej. Salon odpowie w tym wątku.
                            </p>
                        ) : null}
                        {messagesOpen && (
                            <div id={`messages-panel-${visit.id}`}>
                                <MessageThread appointmentId={visit.id} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VisitsPage() {
    const { role, apiFetch } = useAuth();
    const router = useRouter();
    const toast = useToast();
    const [visits, setVisits] = useState<ClientVisit[] | null>(null);
    const [error, setError] = useState(false);
    const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
    const [cancelling, setCancelling] = useState<Set<number>>(new Set());
    const [accepting, setAccepting] = useState<Set<number>>(new Set());
    const [openVisitId, setOpenVisitId] = useState<number | null>(null);

    const load = useCallback(() => {
        apiFetch<ClientVisit[]>('/dashboard/client/visits')
            .then((data) => {
                setVisits(data);
                setError(false);
            })
            .catch(() => setError(true));
    }, [apiFetch]);

    useEffect(() => {
        if (role === 'client') {
            load();
        }
    }, [role, load]);

    useEffect(() => {
        const rawVisitId = router.query.visitId;
        const parsedVisitId =
            typeof rawVisitId === 'string' ? Number(rawVisitId) : NaN;
        if (Number.isFinite(parsedVisitId) && parsedVisitId > 0) {
            setOpenVisitId(parsedVisitId);
            window.setTimeout(() => {
                document
                    .getElementById(`visit-${parsedVisitId}`)
                    ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }, 0);
        }
    }, [router.query.visitId]);

    const openVisit = (id: number) => {
        setOpenVisitId((current) => {
            const next = current === id ? null : id;
            void router.replace(
                next ? `/visits?visitId=${id}` : '/visits',
                undefined,
                {
                    shallow: true,
                },
            );
            return next;
        });
    };

    const cancelVisit = async (id: number) => {
        setCancelling((prev) => new Set(prev).add(id));
        try {
            await apiFetch(`/appointments/${id}/cancel`, { method: 'PATCH' });
            load();
        } catch {
            toast.error('Nie udało się anulować wizyty. Spróbuj ponownie.');
        } finally {
            setCancelling((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const acceptReschedule = async (id: number) => {
        setAccepting((prev) => new Set(prev).add(id));
        try {
            await apiFetch(`/appointments/${id}/accept-reschedule`, {
                method: 'PATCH',
            });
            load();
        } catch {
            toast.error(
                'Nie udało się zaakceptować zmiany terminu. Spróbuj ponownie.',
            );
        } finally {
            setAccepting((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const now = Date.now();
    const upcoming = (visits ?? []).filter(
        (v) =>
            !CLIENT_ARCHIVE_STATUSES.has(v.status) &&
            new Date(v.startTime).getTime() >= now,
    );
    // Chronological for upcoming (nearest first) — the API returns DESC.
    upcoming.reverse();
    const completed = (visits ?? []).filter((v) => v.status === 'completed');
    const cancelled = (visits ?? []).filter(
        (v) =>
            v.status === 'cancelled' ||
            v.status === 'no_show' ||
            (!CLIENT_ARCHIVE_STATUSES.has(v.status) &&
                new Date(v.startTime).getTime() < now),
    );

    const sections: {
        key: string;
        title: string;
        items: ClientVisit[];
        empty: string;
    }[] = [
        {
            key: 'upcoming',
            title: 'Nadchodzące wizyty',
            items: upcoming,
            empty: 'Brak zaplanowanych wizyt.',
        },
        {
            key: 'completed',
            title: 'Odbyte wizyty',
            items: completed,
            empty: 'Nie masz jeszcze odbytych wizyt.',
        },
        {
            key: 'cancelled',
            title: 'Anulowane i nieodbyte',
            items: cancelled,
            empty: 'Brak anulowanych wizyt.',
        },
    ];

    return (
        <RouteGuard roles={['client']}>
            <Head>
                <title>Moje wizyty — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <div className="salonbw-dashboard">
                    <ClientPageHeader title="Moje wizyty" />

                    {error && (
                        <div className="alert alert-warning" role="alert">
                            Nie udało się pobrać historii wizyt.{' '}
                            <button
                                type="button"
                                className="btn btn-link btn-sm p-0 align-baseline"
                                onClick={load}
                            >
                                Spróbuj ponownie
                            </button>
                        </div>
                    )}

                    {!error && visits === null && (
                        <div
                            className="salonbw-dashboard__loading"
                            role="status"
                        >
                            Ładowanie wizyt...
                        </div>
                    )}

                    {visits !== null &&
                        sections.map((section) => (
                            <ClientPanelSection
                                key={section.key}
                                title={section.title}
                                count={section.items.length}
                                className="mb-3"
                            >
                                <div className="salonbw-appointments-list">
                                    {section.items.length === 0 ? (
                                        <div className="salonbw-appointment-item salonbw-appointment-item--empty">
                                            {section.empty}
                                        </div>
                                    ) : (
                                        section.items.map((visit) => (
                                            <VisitRow
                                                key={visit.id}
                                                visit={visit}
                                                onCancel={setConfirmCancelId}
                                                onAccept={(id) =>
                                                    void acceptReschedule(id)
                                                }
                                                onOpen={openVisit}
                                                onRefetch={load}
                                                expanded={
                                                    openVisitId === visit.id
                                                }
                                                cancelling={cancelling.has(
                                                    visit.id,
                                                )}
                                                accepting={accepting.has(
                                                    visit.id,
                                                )}
                                            />
                                        ))
                                    )}
                                </div>
                            </ClientPanelSection>
                        ))}
                </div>
            </SalonShell>
            <ConfirmModal
                open={confirmCancelId !== null}
                title="Anuluj wizytę"
                message="Czy na pewno chcesz anulować tę wizytę?"
                confirmLabel="Anuluj wizytę"
                confirmVariant="danger"
                onConfirm={() => {
                    if (confirmCancelId === null) return;
                    const id = confirmCancelId;
                    setConfirmCancelId(null);
                    void cancelVisit(id);
                }}
                onCancel={() => setConfirmCancelId(null)}
            />
        </RouteGuard>
    );
}
