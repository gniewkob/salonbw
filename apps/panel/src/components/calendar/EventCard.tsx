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
    confirmed: '0 0 0 2px #28a745',
    in_progress: '0 0 0 2px #007bff',
    online_pending: '0 0 0 2px #ffc107',
    rescheduled_pending: '0 0 0 2px #fd7e14',
};

const STATUS_OPACITY: Record<string, number> = {
    completed: 0.6,
    cancelled: 0.4,
    no_show: 0.4,
};

const STATUS_LABELS: Record<string, string> = {
    scheduled: 'Zaplanowana',
    confirmed: 'Potwierdzona',
    in_progress: 'W trakcie',
    completed: 'Zakończona',
    cancelled: 'Anulowana',
    no_show: 'No-show',
    online_pending: 'Oczekuje na potwierdzenie',
    rescheduled_pending: 'Zmiana terminu',
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
    const timeStr = `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`;

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

    const containerStyle: React.CSSProperties = {
        cursor: 'pointer',
        opacity,
        borderRadius: 4,
        padding: '2px 6px',
        fontSize: 12,
        transition: 'box-shadow 0.1s',
        boxShadow: ring,
        ...(isTimeBlock && blockColors
            ? {
                  backgroundColor: blockColors.bg,
                  border: `1px solid ${blockColors.border}`,
                  color: blockColors.color,
              }
            : {
                  borderLeft: `4px solid ${employeeColor}`,
                  backgroundColor: `${employeeColor}15`,
                  textDecoration:
                      event.status === 'cancelled' ? 'line-through' : undefined,
              }),
    };

    return (
        <div
            role="button"
            tabIndex={0}
            draggable={!isTimeBlock}
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
            <div className="d-flex align-items-start justify-content-between gap-1">
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                        className="fw-medium text-truncate"
                        style={
                            isTimeBlock && blockColors
                                ? { color: blockColors.color }
                                : undefined
                        }
                    >
                        {event.title}
                    </div>
                    {!isTimeBlock && event.clientName && (
                        <div className="text-muted text-truncate">
                            {event.clientName}
                        </div>
                    )}
                    <div
                        className="text-muted"
                        style={
                            isTimeBlock && blockColors
                                ? { color: blockColors.color }
                                : undefined
                        }
                    >
                        {event.allDay ? 'Cały dzień' : timeStr}
                    </div>
                    {!isTimeBlock && (
                        <div className="d-flex flex-wrap gap-1 mt-1">
                            {event.status ? (
                                <span className="badge text-bg-light border">
                                    {STATUS_LABELS[event.status] ??
                                        event.status}
                                </span>
                            ) : null}
                            {event.paymentStatus ? (
                                <span className="badge text-bg-light border">
                                    {event.paymentStatus === 'paid'
                                        ? 'Opłacona'
                                        : event.paymentStatus === 'partial'
                                          ? 'Częściowo opłacona'
                                          : 'Nieopłacona'}
                                </span>
                            ) : null}
                            {alertSeverity ? (
                                <span
                                    className={`badge ${ALERT_BADGE_CLASS[alertSeverity]}`}
                                >
                                    Alert CRM
                                </span>
                            ) : null}
                        </div>
                    )}
                </div>
                {isTimeBlock && event.blockType && (
                    <span
                        style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '1px 5px',
                            borderRadius: 3,
                            backgroundColor: blockColors?.bg,
                            color: blockColors?.color,
                            flexShrink: 0,
                        }}
                    >
                        {getBlockTypeLabel(event.blockType)}
                    </span>
                )}
            </div>
        </div>
    );
}

function getBlockTypeLabel(type: TimeBlockType): string {
    const labels: Record<TimeBlockType, string> = {
        break: 'Przerwa',
        vacation: 'Urlop',
        training: 'Szkolenie',
        sick: 'Choroba',
        other: 'Inne',
    };
    return labels[type];
}
