import { useCallback, useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import ConfirmModal from '@/components/ConfirmModal';
import { CLIENT_ARCHIVE_STATUSES } from '@/components/client/ClientAppointmentActions';
import ClientPageHeader from '@/components/client/ClientPageHeader';
import ClientPanelSection from '@/components/client/ClientPanelSection';
import VisitDetailsPanel, {
    type VisitDetailsPanelVisit,
} from '@/components/client/VisitDetailsPanel';
import VisitNotes from '@/components/client/VisitNotes';
import StarRating from '@/components/StarRating';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import PanelButton from '@/components/ui/PanelButton';
import StatusBadge from '@/components/ui/StatusBadge';
import {
    appointmentStatusLabel,
    appointmentStatusTone,
} from '@/lib/appointmentStatus';

interface ClientVisit extends VisitDetailsPanelVisit {
    endTime: string;
    reschedulePreviousEndTime?: string | null;
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
    onOpen,
    onRefetch,
    isOpen,
}: {
    visit: ClientVisit;
    onOpen: (id: number) => void;
    onRefetch: () => void;
    isOpen: boolean;
}) {
    const { apiFetch } = useAuth();
    const toast = useToast();
    const [changingReview, setChangingReview] = useState(false);

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

    const openDetails = (event: React.MouseEvent<HTMLElement>) => {
        // Focus the trigger explicitly (deterministic across browsers/tests)
        // so the panel can restore focus here when it closes.
        event.currentTarget.focus();
        onOpen(visit.id);
    };

    return (
        <div
            id={`visit-${visit.id}`}
            className={[
                'salonbw-appointment-item',
                isOpen ? 'salonbw-appointment-item--expanded' : '',
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <div className="salonbw-appointment-item__details">
                <button
                    type="button"
                    className="salonbw-appointment-item__title-button"
                    aria-haspopup="dialog"
                    onClick={openDetails}
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
            <StatusBadge tone={appointmentStatusTone(displayStatus)}>
                {appointmentStatusLabel(displayStatus)}
            </StatusBadge>
            <PanelButton
                type="button"
                size="sm"
                variant="secondary"
                aria-haspopup="dialog"
                // Z10b: a stable hook for imperative re-focus after an
                // action (e.g. cancel) moves this row to a different
                // section and remounts it — see the `visits` effect below.
                className="salonbw-appointment-item__details-trigger"
                onClick={openDetails}
            >
                Szczegóły
            </PanelButton>
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
    const pageHeadingRef = useRef<HTMLHeadingElement>(null);
    // Z10b: cancelling closes the panel and restores focus to the row's
    // "Szczegóły" trigger — but the subsequent refetch can move that visit
    // into a different section (e.g. "Nadchodzące" → "Anulowane"), which
    // remounts the row and silently drops focus to <body>. Set this right
    // before refetching; the effect below re-anchors focus once the new
    // section has rendered.
    const pendingFocusVisitIdRef = useRef<number | null>(null);

    const load = useCallback(() => {
        apiFetch<ClientVisit[]>('/dashboard/client/visits')
            .then((data) => {
                setVisits(data);
                setError(false);
            })
            .catch(() => setError(true));
    }, [apiFetch]);

    useEffect(() => {
        const pendingId = pendingFocusVisitIdRef.current;
        if (pendingId === null || visits === null) return;
        pendingFocusVisitIdRef.current = null;
        const trigger = document
            .getElementById(`visit-${pendingId}`)
            ?.querySelector<HTMLElement>(
                '.salonbw-appointment-item__details-trigger',
            );
        if (trigger) {
            trigger.focus();
        } else {
            // The visit may have left the list entirely (or the DOM hasn't
            // settled) — fall back to the page heading rather than letting
            // focus silently land on <body>.
            pageHeadingRef.current?.focus();
        }
    }, [visits]);

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
        }
    }, [router.query.visitId]);

    const openVisit = (id: number) => {
        setOpenVisitId(id);
        void router.replace(`/visits?visitId=${id}`, undefined, {
            shallow: true,
        });
    };

    const closeVisit = () => {
        setOpenVisitId(null);
        void router.replace('/visits', undefined, { shallow: true });
    };

    const cancelVisit = async (id: number) => {
        setCancelling((prev) => new Set(prev).add(id));
        try {
            await apiFetch(`/appointments/${id}/cancel`, { method: 'PATCH' });
            closeVisit();
            pendingFocusVisitIdRef.current = id;
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
            toast.success('Nowy termin zaakceptowany.');
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

    const openVisitDetails =
        (visits ?? []).find((v) => v.id === openVisitId) ?? null;

    return (
        <RouteGuard roles={['client']}>
            <Head>
                <title>Moje wizyty — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <div className="salonbw-dashboard">
                    <ClientPageHeader
                        title="Moje wizyty"
                        titleRef={pageHeadingRef}
                    />

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
                                                onOpen={openVisit}
                                                onRefetch={load}
                                                isOpen={
                                                    openVisitId === visit.id
                                                }
                                            />
                                        ))
                                    )}
                                </div>
                            </ClientPanelSection>
                        ))}
                </div>
            </SalonShell>
            <VisitDetailsPanel
                visit={openVisitDetails}
                onClose={closeVisit}
                onAccept={(id) => void acceptReschedule(id)}
                onCancel={setConfirmCancelId}
                suspended={confirmCancelId !== null}
                accepting={
                    openVisitDetails
                        ? accepting.has(openVisitDetails.id)
                        : false
                }
                cancelling={
                    openVisitDetails
                        ? cancelling.has(openVisitDetails.id)
                        : false
                }
            />
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
