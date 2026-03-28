'use client';

import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { TimetableException, ExceptionType } from '@/types';

interface Props {
    exceptions: TimetableException[];
    onEdit?: (exception: TimetableException) => void;
    onDelete?: (id: number) => Promise<void> | void;
    onApprove?: (id: number) => Promise<void> | void;
    canApprove?: boolean;
}

const EXCEPTION_STYLES: Record<
    ExceptionType,
    { bg: string; text: string; label: string }
> = {
    day_off: {
        bg: 'bg-secondary bg-opacity-10',
        text: 'text-body',
        label: 'Dzień wolny',
    },
    vacation: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Urlop' },
    sick_leave: { bg: 'bg-red-100', text: 'text-red-700', label: 'L4' },
    training: {
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        label: 'Szkolenie',
    },
    custom_hours: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        label: 'Zmienione godziny',
    },
    other: {
        bg: 'bg-secondary bg-opacity-10',
        text: 'text-muted',
        label: 'Inne',
    },
};

export default function ExceptionsList({
    exceptions,
    onEdit,
    onDelete,
    onApprove,
    canApprove,
}: Props) {
    if (exceptions.length === 0) {
        return (
            <div className="text-center py-4 text-muted">
                Brak zaplanowanych wyjątków
            </div>
        );
    }

    return (
        <div className="gap-2">
            {exceptions.map((exception) => {
                const style = EXCEPTION_STYLES[exception.type];
                const dateStr = format(
                    parseISO(exception.date),
                    'd MMMM yyyy',
                    {
                        locale: pl,
                    },
                );

                return (
                    <div
                        key={exception.id}
                        className={`d-flex align-items-center justify-content-between p-2 rounded-3 border ${
                            exception.isPending
                                ? 'border-yellow-300 bg-warning bg-opacity-10'
                                : 'border-secondary border-opacity-25 bg-white'
                        }`}
                    >
                        <div className="d-flex align-items-center gap-2">
                            <span
                                className={`px-2 py-1 rounded small fw-medium ${style.bg} ${style.text}`}
                            >
                                {style.label}
                            </span>
                            <div>
                                <div className="fw-medium text-dark">
                                    {exception.title || dateStr}
                                </div>
                                <div className="small text-muted">
                                    {exception.title && dateStr}
                                    {exception.type === 'custom_hours' &&
                                        !exception.isAllDay &&
                                        exception.customStartTime &&
                                        exception.customEndTime && (
                                            <span className="ms-2">
                                                {exception.customStartTime} -{' '}
                                                {exception.customEndTime}
                                            </span>
                                        )}
                                </div>
                            </div>
                            {exception.isPending && (
                                <span className="px-2 py-0.5 bg-warning bg-opacity-10 text-warning rounded small">
                                    Oczekuje na zatwierdzenie
                                </span>
                            )}
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            {exception.isPending && canApprove && onApprove && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        void onApprove(exception.id);
                                    }}
                                    className="px-3 py-1 small bg-success bg-opacity-10 text-success rounded bg-opacity-10"
                                >
                                    Zatwierdź
                                </button>
                            )}
                            {onEdit && (
                                <button
                                    type="button"
                                    onClick={() => onEdit(exception)}
                                    className="p-1 text-muted rounded"
                                    title="Edytuj"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                        />
                                    </svg>
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        void onDelete(exception.id);
                                    }}
                                    className="p-1 text-danger bg-opacity-10 rounded"
                                    title="Usuń"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
