import type { CSSProperties } from 'react';
import { format } from 'date-fns';
import type {
    CalendarEvent,
    ReceptionAlertSeverity,
    TimeBlockType,
} from '@/types';

interface EventCardProps {
    event: CalendarEvent;
    onClick: (event: CalendarEvent) => void;
    onDragStart?: (event: CalendarEvent) => void;
}

const TIME_BLOCK_COLORS: Record<
    TimeBlockType,
    { bg: string; border: string; color: string }
> = {
    break: { bg: '#f0f0f0', border: '#ccc', color: '#555' },
    vacation: { bg: '#d4edda', border: '#c3e6cb', color: '#155724' },
    training: { bg: '#cce5ff', border: '#b8daff', color: '#004085' },
    sick: { bg: '#f8d7da', border: '#f5c6cb', color: '#721c24' },
    other: { bg: '#fff3cd', border: '#ffeeba', color: '#856404' },
};

const STATUS_RING: Record<string, string | undefined> = {
    in_progress: '0 0 0 2px #0d0d0d',
    online_pending: '0 0 0 2px #b45309',
    rescheduled_pending: '0 0 0 2px #b45309',
};

const STATUS_OPACITY: Record<string, number> = {
    completed: 0.6,
    cancelled: 0.4,
    no_show: 0.4,
};

/**
 * Brand B&W palette driven by appointment STATUS (employee colour is
 * meaningless for a one-person salon). `strip` is the dark/silver header
 * band, `stripText` keeps WCAG contrast on it, `body` is the light fill.
 * Semantic amber is reserved for states that need the owner's attention
 * (online/rescheduled pending) — the only allowed non-grey accent.
 */
export interface EventStatusVisual {
    strip: string;
    stripText: string;
    body: string;
}

const STATUS_VISUAL: Record<string, EventStatusVisual> = {
    scheduled: { strip: '#5b626b', stripText: '#ffffff', body: '#f3f4f6' },
    confirmed: { strip: '#0d0d0d', stripText: '#ffffff', body: '#f1f1f2' },
    in_progress: { strip: '#0d0d0d', stripText: '#ffffff', body: '#ececed' },
    completed: { strip: '#9a9ea4', stripText: '#0d0d0d', body: '#f5f6f7' },
    cancelled: { strip: '#c4c8ce', stripText: '#0d0d0d', body: '#f7f8f9' },
    no_show: { strip: '#c4c8ce', stripText: '#0d0d0d', body: '#f7f8f9' },
    online_pending: { strip: '#b45309', stripText: '#ffffff', body: '#fdf6ee' },
    rescheduled_pending: {
        strip: '#b45309',
        stripText: '#ffffff',
        body: '#fdf6ee',
    },
};

const DEFAULT_VISUAL: EventStatusVisual = STATUS_VISUAL.scheduled;

export function getEventStatusVisual(status?: string): EventStatusVisual {
    return (status && STATUS_VISUAL[status]) || DEFAULT_VISUAL;
}

const STATUS_LABELS: Record<string, string> = {
    confirmed: 'Potwierdzona',
    in_progress: 'W trakcie',
    completed: 'Zakończona',
    cancelled: 'Anulowana',
    no_show: 'No-show',
    online_pending: 'Online — czeka',
    rescheduled_pending: 'Czeka na klienta',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    cash: 'gotówka',
    card: 'karta',
    transfer: 'przelew',
    online: 'online',
    voucher: 'voucher',
};

const ALERT_ICON: Record<ReceptionAlertSeverity, string> = {
    info: '●',
    warning: '●',
    danger: '●',
};

const ALERT_COLOR: Record<ReceptionAlertSeverity, string> = {
    info: '#0dcaf0',
    warning: '#ffc107',
    danger: '#dc3545',
};

export default function EventCard({
    event,
    onClick,
    onDragStart,
}: EventCardProps) {
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    const timeStr = `${format(startTime, 'HH:mm')} – ${format(endTime, 'HH:mm')}`;

    const isTimeBlock = event.type === 'time_block';
    const blockColors =
        isTimeBlock && event.blockType
            ? TIME_BLOCK_COLORS[event.blockType]
            : null;

    const ring = event.status
        ? (STATUS_RING[event.status] ?? undefined)
        : undefined;
    const opacity = event.status ? (STATUS_OPACITY[event.status] ?? 1) : 1;

    const alertSeverity =
        event.customerAlertSeverity ??
        (event.hasCustomerAlerts ? 'warning' : undefined);

    const statusLabel = event.status
        ? (STATUS_LABELS[event.status] ?? null)
        : null;

    // Versum-style: show what was paid on settled visits, at a glance.
    // Decimal amounts can arrive as strings (TypeORM/JSON), so coerce before
    // formatting — calling .toFixed on a string crashed the whole calendar.
    const paidAmountNumber = Number(event.paidAmount);
    const paymentLabel =
        Number.isFinite(paidAmountNumber) && paidAmountNumber > 0
            ? `Zapłacono ${paidAmountNumber.toFixed(0)} zł${
                  event.paymentMethod
                      ? ` · ${PAYMENT_METHOD_LABELS[event.paymentMethod] ?? event.paymentMethod}`
                      : ''
              }`
            : null;

    const visual = getEventStatusVisual(event.status);

    const wrapperStyle: CSSProperties = {
        cursor: 'pointer',
        opacity,
        borderRadius: 3,
        overflow: 'hidden',
        backgroundColor: visual.body,
        border: '1px solid rgba(13, 13, 13, 0.08)',
        borderLeft: `3px solid ${visual.strip}`,
        boxShadow: ring ?? 'none',
        height: '100%',
        padding: '4px 7px',
        transition: 'box-shadow 0.12s, border-color 0.12s',
        textDecoration:
            event.status === 'cancelled' ? 'line-through' : undefined,
    };

    if (isTimeBlock && blockColors) {
        return (
            <div
                className="salonbw-event-card salonbw-event-card--block"
                role="button"
                tabIndex={0}
                onClick={() => onClick(event)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClick(event);
                    }
                }}
                style={{
                    ...wrapperStyle,
                    backgroundColor: blockColors.bg,
                    border: `1px solid ${blockColors.border}`,
                    padding: '3px 7px',
                    fontSize: 12,
                }}
            >
                <div
                    className="fw-medium text-truncate"
                    style={{ color: blockColors.color }}
                >
                    {event.title}
                </div>
                {!event.allDay && (
                    <div
                        style={{
                            fontSize: 10.5,
                            color: blockColors.color,
                            opacity: 0.8,
                        }}
                    >
                        {timeStr}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className="salonbw-event-card"
            role="button"
            tabIndex={0}
            draggable
            onClick={() => onClick(event)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick(event);
                }
            }}
            onDragStart={() => onDragStart?.(event)}
            style={wrapperStyle}
        >
            <div className="salonbw-event-card__time">
                <span>{event.allDay ? 'Cały dzień' : timeStr}</span>
                {alertSeverity && (
                    <span
                        style={{
                            color: ALERT_COLOR[alertSeverity],
                            fontSize: 9,
                            lineHeight: 1,
                        }}
                    >
                        {ALERT_ICON[alertSeverity]}
                    </span>
                )}
            </div>

            <div className="salonbw-event-card__body">
                {event.clientName && (
                    <div className="salonbw-event-card__client text-truncate">
                        {event.clientName}
                    </div>
                )}
                <div
                    className={
                        event.clientName
                            ? 'salonbw-event-card__service text-truncate'
                            : 'salonbw-event-card__service salonbw-event-card__service--primary text-truncate'
                    }
                >
                    {event.title}
                </div>
                {statusLabel && (
                    <div className="salonbw-event-card__meta">
                        {statusLabel}
                    </div>
                )}
                {paymentLabel && (
                    <div className="salonbw-event-card__payment text-truncate">
                        {paymentLabel}
                    </div>
                )}
            </div>
        </div>
    );
}
