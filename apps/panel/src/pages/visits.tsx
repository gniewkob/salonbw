import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import ConfirmModal from '@/components/ConfirmModal';
import StarRating from '@/components/StarRating';
import MessageThread from '@/components/messages/MessageThread';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import PanelButton from '@/components/ui/PanelButton';
import StatusBadge from '@/components/ui/StatusBadge';
import {
    appointmentStatusLabel,
    appointmentStatusTone,
} from '@/lib/appointmentStatus';

interface ClientVisit {
    id: number;
    startTime: string;
    endTime: string;
    status: string;
    serviceId: number;
    serviceName: string;
    employeeName: string;
    notes: string | null;
    review: { id: number; rating: number; comment: string | null } | null;
}

const CANCELLABLE = new Set([
    'scheduled',
    'confirmed',
    'online_pending',
    'rescheduled_pending',
]);
const ARCHIVE_STATUSES = new Set(['completed', 'cancelled', 'no_show']);

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
    onRefetch,
    cancelling,
    accepting,
}: {
    visit: ClientVisit;
    onCancel: (id: number) => void;
    onAccept: (id: number) => void;
    onRefetch: () => void;
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

    return (
        <div className="salonbw-appointment-item">
            <div className="salonbw-appointment-item__details">
                <div className="salonbw-appointment-item__client">
                    {visit.serviceName}
                </div>
                <div className="salonbw-appointment-item__service text-muted small">
                    {formatDateTime(visit.startTime)}
                </div>
                {visit.employeeName && (
                    <div className="salonbw-appointment-item__service text-muted small">
                        specjalista: {visit.employeeName}
                    </div>
                )}
                {visit.notes && (
                    <div className="small mt-1">
                        <span className="text-muted">Notatki i zalecenia:</span>{' '}
                        {visit.notes}
                    </div>
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
            <div className="d-flex align-items-center gap-2 flex-wrap">
                <StatusBadge tone={appointmentStatusTone(visit.status)}>
                    {appointmentStatusLabel(visit.status)}
                </StatusBadge>
                {visit.status === 'rescheduled_pending' && (
                    <PanelButton
                        type="button"
                        size="sm"
                        variant="primary"
                        disabled={accepting}
                        onClick={() => onAccept(visit.id)}
                    >
                        Akceptuj nowy termin
                    </PanelButton>
                )}
                {CANCELLABLE.has(visit.status) && (
                    <PanelButton
                        type="button"
                        size="sm"
                        variant="danger"
                        disabled={cancelling}
                        onClick={() => onCancel(visit.id)}
                    >
                        Anuluj
                    </PanelButton>
                )}
                {ARCHIVE_STATUSES.has(visit.status) && (
                    <PanelButton
                        href={`/booking?serviceId=${visit.serviceId}`}
                        size="sm"
                        variant="secondary"
                    >
                        Umów ponownie
                    </PanelButton>
                )}
            </div>

            <div className="salonbw-appointment-item__messages">
                <button
                    type="button"
                    className="salonbw-appointment-item__message-toggle"
                    aria-expanded={messagesOpen}
                    aria-controls={`messages-panel-${visit.id}`}
                    onClick={() => setMessagesOpen((v) => !v)}
                >
                    {messagesOpen
                        ? 'Ukryj wiadomości z salonem'
                        : 'Wiadomości z salonem'}
                </button>
                {messagesOpen && (
                    <div
                        id={`messages-panel-${visit.id}`}
                        className="salonbw-appointment-item__message-panel"
                    >
                        <MessageThread appointmentId={visit.id} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VisitsPage() {
    const { role, apiFetch } = useAuth();
    const toast = useToast();
    const [visits, setVisits] = useState<ClientVisit[] | null>(null);
    const [error, setError] = useState(false);
    const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
    const [cancelling, setCancelling] = useState<Set<number>>(new Set());
    const [accepting, setAccepting] = useState<Set<number>>(new Set());

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
            !ARCHIVE_STATUSES.has(v.status) &&
            new Date(v.startTime).getTime() >= now,
    );
    // Chronological for upcoming (nearest first) — the API returns DESC.
    upcoming.reverse();
    const completed = (visits ?? []).filter((v) => v.status === 'completed');
    const cancelled = (visits ?? []).filter(
        (v) =>
            v.status === 'cancelled' ||
            v.status === 'no_show' ||
            (!ARCHIVE_STATUSES.has(v.status) &&
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
                    <div className="salonbw-dashboard__header">
                        <h1 className="salonbw-dashboard__title">
                            Moje wizyty
                        </h1>
                        <PanelButton href="/booking" variant="primary">
                            Zarezerwuj wizytę
                        </PanelButton>
                    </div>

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
                            <div
                                key={section.key}
                                className="salonbw-dashboard__section mb-3"
                            >
                                <div className="salonbw-dashboard__section-header">
                                    <h2>
                                        {section.title}
                                        {section.items.length > 0 && (
                                            <span className="text-muted fw-normal">
                                                {' '}
                                                ({section.items.length})
                                            </span>
                                        )}
                                    </h2>
                                </div>
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
                                                onRefetch={load}
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
                            </div>
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
