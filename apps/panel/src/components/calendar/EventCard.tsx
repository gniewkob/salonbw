import { format } from 'date-fns';
import type { CalendarEvent, TimeBlockType } from '@/types';

interface EventCardProps {
    event: CalendarEvent;
    employeeColor?: string;
    onClick: (event: CalendarEvent) => void;
    onDragStart?: (event: CalendarEvent) => void;
}

const TIME_BLOCK_COLORS: Record<
    TimeBlockType,
    { bg: string; border: string; text: string }
> = {
    break: {
        bg: 'bg-secondary bg-opacity-10',
        border: 'border-gray-300',
        text: 'text-muted',
    },
    vacation: {
        bg: 'bg-green-100',
        border: 'border-green-300',
        text: 'text-green-700',
    },
    training: {
        bg: 'bg-blue-100',
        border: 'border-blue-300',
        text: 'text-blue-700',
    },
    sick: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700' },
    other: {
        bg: 'bg-yellow-100',
        border: 'border-yellow-300',
        text: 'text-yellow-700',
    },
};

const STATUS_STYLES: Record<string, string> = {
    scheduled: 'opacity-100',
    confirmed: 'opacity-100 ring-2 ring-green-500',
    in_progress: 'opacity-100 ring-2 ring-blue-500',
    completed: 'opacity-60',
    cancelled: 'opacity-40 line-through',
    no_show: 'opacity-40 bg-red-100',
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

    const statusStyle = event.status ? (STATUS_STYLES[event.status] ?? '') : '';

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
            className={`
                rounded-md px-2 py-1 small cursor-pointer transition-shadow
                
                ${
                    isTimeBlock
                        ? `${blockColors?.bg} ${blockColors?.border} border`
                        : 'border-l-4'
                }
                ${statusStyle}
            `}
            style={
                !isTimeBlock
                    ? {
                          borderLeftColor: employeeColor,
                          backgroundColor: `${employeeColor}15`,
                      }
                    : undefined
            }
        >
            <div className="d-flex align-items-start justify-content-between gap-1">
                <div className="flex-fill min-w-0">
                    <div
                        className={`fw-medium text-truncate ${isTimeBlock ? blockColors?.text : ''}`}
                    >
                        {event.title}
                    </div>
                    {!isTimeBlock && event.customerName && (
                        <div className="text-muted text-truncate">
                            {event.customerName}
                        </div>
                    )}
                    <div
                        className={`text-muted ${isTimeBlock ? blockColors?.text : ''}`}
                    >
                        {event.allDay ? 'Cały dzień' : timeStr}
                    </div>
                </div>
                {isTimeBlock && event.blockType && (
                    <span
                        className={`px-1.5 py-0.5 rounded text-[10px] fw-medium ${blockColors?.text} ${blockColors?.bg}`}
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
