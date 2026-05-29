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
    break: { bg: '#f0f0f0', border: '#ccc', color: '#555' },
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

const STATUS_LABELS: Record<string, string> = {
    confirmed: 'Potwierdzona',
    in_progress: 'W trakcie',
    completed: 'Zakończona',
    cancelled: 'Anulowana',
    no_show: 'No-show',
    online_pending: 'Online — czeka',
    rescheduled_pending: 'Nowy termin',
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
    employeeColor = '#d48cb0',
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

    const wrapperStyle: CSSProperties = {
        cursor: 'pointer',
        opacity,
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: ring ?? '0 1px 2px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.1s',
        textDecoration:
            event.status === 'cancelled' ? 'line-through' : undefined,
    };

    if (isTimeBlock && blockColors) {
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
            {/* Versum-style: darker header strip with time */}
            <div
                style={{
                    backgroundColor: employeeColor,
                    padding: '2px 7px',
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'white',
                    lineHeight: 1.4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                }}
            >
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

            {/* Light-fill body: client + service */}
            <div
                style={{
                    backgroundColor: `${employeeColor}22`,
                    padding: '2px 7px 3px',
                    fontSize: 12,
                    lineHeight: 1.35,
                }}
            >
                {event.clientName && (
                    <div
                        className="text-truncate"
                        style={{ fontWeight: 600, color: '#1a1a2e' }}
                    >
                        {event.clientName}
                    </div>
                )}
                <div
                    className="text-truncate"
                    style={{
                        color: '#444',
                        fontWeight: event.clientName ? 400 : 600,
                        fontSize: 11.5,
                    }}
                >
                    {event.title}
                </div>
                {statusLabel && (
                    <div
                        style={{
                            fontSize: 10,
                            color: employeeColor,
                            fontWeight: 600,
                            marginTop: 1,
                        }}
                    >
                        {statusLabel}
                    </div>
                )}
            </div>
        </div>
    );
}
