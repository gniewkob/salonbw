import type { CSSProperties } from 'react';
import { format } from 'date-fns';
import type {
    CalendarEvent,
    ReceptionAlertSeverity,
    TimeBlockType,
} from '@/types';

interface EventCardProps {
    event: CalendarEvent;
    employeeColor?: string;
    onClick: (event: CalendarEvent) => void;
    onDragStart?: (event: CalendarEvent) => void;
}

const TIME_BLOCK_COLORS: Record<
    TimeBlockType,
    { bg: string; border: string; color: string }
> = {
    break: { bg: '#f0f0f0', border: '#ccc', color: '#666' },
    vacation: { bg: '#d4edda', border: '#c3e6cb', color: '#155724' },
    training: { bg: '#cce5ff', border: '#b8daff', color: '#004085' },
    sick: { bg: '#f8d7da', border: '#f5c6cb', color: '#721c24' },
    other: { bg: '#fff3cd', border: '#ffeeba', color: '#856404' },
};

const STATUS_RING: Record<string, string | undefined> = {
    in_progress: '0 0 0 2px #007bff',
    online_pending: '0 0 0 2px #ffc107',
    rescheduled_pending: '0 0 0 2px #fd7e14',
};

const STATUS_OPACITY: Record<string, number> = {
    completed: 0.55,
    cancelled: 0.35,
    no_show: 0.35,
};

// Only show status badge when it's non-trivial (skip 'scheduled' — it's the default)
const STATUS_LABELS: Record<string, string> = {
    confirmed: 'Potwierdzona',
    in_progress: 'W trakcie',
    completed: 'Zakończona',
    cancelled: 'Anulowana',
    no_show: 'No-show',
    online_pending: 'Online — czeka',
    rescheduled_pending: 'Nowy termin',
};

const ALERT_BADGE_CLASS: Record<ReceptionAlertSeverity, string> = {
    info: 'bg-info-subtle text-info-emphasis',
    warning: 'bg-warning-subtle text-warning-emphasis',
    danger: 'bg-danger-subtle text-danger-emphasis',
};

export default function EventCard({
    event,
    employeeColor = '#4A90D9',
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

    const containerStyle: CSSProperties = {
        cursor: 'pointer',
        opacity,
        borderRadius: 5,
        padding: '3px 7px 4px',
        fontSize: 12,
        lineHeight: 1.4,
        transition: 'box-shadow 0.1s',
        boxShadow: ring,
        overflow: 'hidden',
        ...(isTimeBlock && blockColors
            ? {
                  backgroundColor: blockColors.bg,
                  border: `1px solid ${blockColors.border}`,
                  color: blockColors.color,
              }
            : {
                  borderLeft: `3px solid ${employeeColor}`,
                  backgroundColor: `${employeeColor}18`,
                  textDecoration:
                      event.status === 'cancelled' ? 'line-through' : undefined,
              }),
    };

    if (isTimeBlock) {
        return (
            <div
                role="button"
                tabIndex={0}
                onClick={() => onClick(event)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClick(event);
                    }
                }}
                style={containerStyle}
            >
                <div
                    className="fw-medium text-truncate"
                    style={
                        blockColors ? { color: blockColors.color } : undefined
                    }
                >
                    {event.title}
                </div>
                {!event.allDay && (
                    <div
                        className="text-truncate"
                        style={{
                            fontSize: 11,
                            color: blockColors?.color ?? '#666',
                            opacity: 0.85,
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
            style={containerStyle}
        >
            {/* Client name — primary info */}
            {event.clientName && (
                <div
                    className="text-truncate"
                    style={{ fontWeight: 600, fontSize: 12.5 }}
                >
                    {event.clientName}
                    {alertSeverity && (
                        <span
                            className={`ms-1 badge ${ALERT_BADGE_CLASS[alertSeverity]}`}
                            style={{ fontSize: 9, verticalAlign: 'middle' }}
                        >
                            !
                        </span>
                    )}
                </div>
            )}

            {/* Service title */}
            <div
                className="text-truncate"
                style={{
                    color: '#555',
                    fontSize: 11.5,
                    fontWeight: event.clientName ? 400 : 600,
                }}
            >
                {event.title}
            </div>

            {/* Time */}
            <div style={{ color: '#777', fontSize: 11 }}>
                {event.allDay ? 'Cały dzień' : timeStr}
            </div>

            {/* Non-default status badge */}
            {statusLabel && (
                <div className="mt-1">
                    <span
                        className="badge text-bg-light border"
                        style={{ fontSize: 10 }}
                    >
                        {statusLabel}
                    </span>
                </div>
            )}
        </div>
    );
}
