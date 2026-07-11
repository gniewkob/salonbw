import { useEffect, useId, useRef, useState } from 'react';
import ClientAppointmentActions, {
    CLIENT_ARCHIVE_STATUSES,
    CLIENT_CANCELLABLE_STATUSES,
} from '@/components/client/ClientAppointmentActions';
import RescheduleChangeNotice from '@/components/client/RescheduleChangeNotice';
import VisitNotes from '@/components/client/VisitNotes';
import MessageThread, {
    type MessageThreadHandle,
} from '@/components/messages/MessageThread';
import PanelButton from '@/components/ui/PanelButton';
import StatusBadge from '@/components/ui/StatusBadge';
import {
    appointmentStatusLabel,
    appointmentStatusTone,
} from '@/lib/appointmentStatus';

export interface VisitDetailsPanelVisit {
    id: number;
    startTime: string;
    reschedulePreviousStartTime?: string | null;
    status: string;
    serviceId: number;
    serviceName: string;
    employeeName: string;
    clientComment?: string | null;
    staffRecommendations?: string | null;
    onlineAddonsSummary?: string | null;
    onlineTotalDurationMinutes?: number | null;
    onlineDurationNeedsVerification?: boolean;
}

interface VisitDetailsPanelProps {
    visit: VisitDetailsPanelVisit | null;
    onClose: () => void;
    onAccept: (id: number) => void;
    onCancel: (id: number) => void;
    accepting: boolean;
    cancelling: boolean;
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

function isPastUnresolved(visit: VisitDetailsPanelVisit, isFuture: boolean) {
    return !isFuture && !CLIENT_ARCHIVE_STATUSES.has(visit.status);
}

export default function VisitDetailsPanel({
    visit,
    onClose,
    onAccept,
    onCancel,
    accepting,
    cancelling,
}: VisitDetailsPanelProps) {
    const open = visit !== null;
    const headingRef = useRef<HTMLHeadingElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<Element | null>(null);
    const messageThreadRef = useRef<MessageThreadHandle>(null);
    const [hasMessages, setHasMessages] = useState(false);
    const titleId = useId();

    // Focus the panel heading on open; return focus to whatever triggered
    // the open (the row's "Szczegóły" button) once it closes.
    useEffect(() => {
        if (open) {
            triggerRef.current = document.activeElement;
            headingRef.current?.focus();
        } else if (triggerRef.current) {
            (triggerRef.current as HTMLElement).focus();
            triggerRef.current = null;
        }
    }, [open]);

    // A newly opened visit means the previous thread's "has messages" state
    // is stale until the fresh thread reports in.
    useEffect(() => {
        setHasMessages(false);
    }, [visit?.id]);

    useEffect(() => {
        if (typeof document === 'undefined' || !open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            if (e.key !== 'Tab') return;
            const root = panelRef.current;
            if (!root) return;
            const focusable = Array.from(
                root.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
                ),
            );
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (
                    document.activeElement === first ||
                    !root.contains(document.activeElement)
                ) {
                    e.preventDefault();
                    last.focus();
                }
            } else if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!visit) return null;

    const isFuture = new Date(visit.startTime).getTime() > Date.now();
    const pastUnresolved = isPastUnresolved(visit, isFuture);
    const displayStatus = pastUnresolved ? 'no_show' : visit.status;
    const canAskForNewTime =
        isFuture && !CLIENT_ARCHIVE_STATUSES.has(visit.status);

    const handleWriteMessage = () => {
        messageThreadRef.current?.focusCompose();
    };

    return (
        <div className="visit-details-panel-overlay" onClick={onClose}>
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="visit-details-panel"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="visit-details-panel__header">
                    <h2
                        id={titleId}
                        ref={headingRef}
                        tabIndex={-1}
                        className="visit-details-panel__title"
                    >
                        {visit.serviceName}
                    </h2>
                    <button
                        type="button"
                        className="btn-close"
                        aria-label="Zamknij"
                        onClick={onClose}
                    />
                </div>
                <div className="visit-details-panel__body">
                    <div className="visit-details-panel__meta">
                        <span>{formatDateTime(visit.startTime)}</span>
                        {visit.employeeName && (
                            <span>specjalista: {visit.employeeName}</span>
                        )}
                        <StatusBadge
                            tone={appointmentStatusTone(displayStatus)}
                        >
                            {appointmentStatusLabel(displayStatus)}
                        </StatusBadge>
                    </div>

                    {visit.status === 'rescheduled_pending' && (
                        <RescheduleChangeNotice
                            previousStartTime={
                                visit.reschedulePreviousStartTime
                            }
                            newStartTime={visit.startTime}
                        />
                    )}

                    <div className="visit-details-panel__section">
                        <div className="visit-details-label">
                            Notatki i zalecenia
                        </div>
                        <VisitNotes
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
                    </div>

                    <div className="visit-details-panel__section">
                        <div className="visit-details-label">
                            Co możesz zrobić
                        </div>
                        <ClientAppointmentActions
                            serviceId={visit.serviceId}
                            accepting={accepting}
                            cancelling={cancelling}
                            canAccept={
                                isFuture &&
                                visit.status === 'rescheduled_pending'
                            }
                            canCancel={
                                isFuture &&
                                CLIENT_CANCELLABLE_STATUSES.has(visit.status)
                            }
                            showRebook={
                                CLIENT_ARCHIVE_STATUSES.has(visit.status) ||
                                pastUnresolved
                            }
                            onAccept={() => onAccept(visit.id)}
                            onCancel={() => onCancel(visit.id)}
                        />
                    </div>

                    <div className="visit-details-panel__section">
                        <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                            <div className="visit-details-label mb-0">
                                Wiadomości
                            </div>
                            <PanelButton
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={handleWriteMessage}
                            >
                                {hasMessages ? 'Odpowiedz' : 'Napisz wiadomość'}
                            </PanelButton>
                        </div>
                        {canAskForNewTime && (
                            <p className="visit-details-hint">
                                Napisz, jaki dzień lub zakres godzin pasuje Ci
                                lepiej. Salon odpowie w tym wątku.
                            </p>
                        )}
                        <MessageThread
                            ref={messageThreadRef}
                            appointmentId={visit.id}
                            onThreadLoaded={(messages) =>
                                setHasMessages(messages.length > 0)
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
