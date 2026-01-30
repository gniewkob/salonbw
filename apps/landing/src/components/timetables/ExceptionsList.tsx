'use client';

import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { TimetableException, ExceptionType } from '@/types';

interface Props {
    exceptions: TimetableException[];
    onEdit?: (exception: TimetableException) => void;
    onDelete?: (id: number) => void;
    onApprove?: (id: number) => void;
    canApprove?: boolean;
}

const EXCEPTION_STYLES: Record<ExceptionType, { bg: string; text: string; label: string }> = {
    day_off: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Dzień wolny' },
    vacation: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Urlop' },
    sick_leave: { bg: 'bg-red-100', text: 'text-red-700', label: 'L4' },
    training: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Szkolenie' },
    custom_hours: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Zmienione godziny' },
    other: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Inne' },
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
            <div className="text-center py-8 text-gray-500">
                Brak zaplanowanych wyjątków
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {exceptions.map((exception) => {
                const style = EXCEPTION_STYLES[exception.type];
                const dateStr = format(parseISO(exception.date), 'd MMMM yyyy', {
                    locale: pl,
                });

                return (
                    <div
                        key={exception.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                            exception.isPending
                                ? 'border-yellow-300 bg-yellow-50'
                                : 'border-gray-200 bg-white'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <span
                                className={`px-2 py-1 rounded text-xs font-medium ${style.bg} ${style.text}`}
                            >
                                {style.label}
                            </span>
                            <div>
                                <div className="font-medium text-gray-800">
                                    {exception.title || dateStr}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {exception.title && dateStr}
                                    {exception.type === 'custom_hours' &&
                                        !exception.isAllDay &&
                                        exception.customStartTime &&
                                        exception.customEndTime && (
                                            <span className="ml-2">
                                                {exception.customStartTime} - {exception.customEndTime}
                                            </span>
                                        )}
                                </div>
                            </div>
                            {exception.isPending && (
                                <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded text-xs">
                                    Oczekuje na zatwierdzenie
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {exception.isPending && canApprove && onApprove && (
                                <button
                                    type="button"
                                    onClick={() => onApprove(exception.id)}
                                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                >
                                    Zatwierdź
                                </button>
                            )}
                            {onEdit && (
                                <button
                                    type="button"
                                    onClick={() => onEdit(exception)}
                                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
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
                                    onClick={() => onDelete(exception.id)}
                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
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
