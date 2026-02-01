import type { CalendarView } from '@/types';
import {
    format,
    addDays,
    subDays,
    addWeeks,
    subWeeks,
    addMonths,
    subMonths,
} from 'date-fns';
import { pl } from 'date-fns/locale';

interface CalendarHeaderProps {
    date: Date;
    view: CalendarView;
    onDateChange: (date: Date) => void;
    onViewChange: (view: CalendarView) => void;
    onTodayClick: () => void;
}

export default function CalendarHeader({
    date,
    view,
    onDateChange,
    onViewChange,
    onTodayClick,
}: CalendarHeaderProps) {
    const handlePrev = () => {
        switch (view) {
            case 'day':
                onDateChange(subDays(date, 1));
                break;
            case 'week':
                onDateChange(subWeeks(date, 1));
                break;
            case 'month':
                onDateChange(subMonths(date, 1));
                break;
        }
    };

    const handleNext = () => {
        switch (view) {
            case 'day':
                onDateChange(addDays(date, 1));
                break;
            case 'week':
                onDateChange(addWeeks(date, 1));
                break;
            case 'month':
                onDateChange(addMonths(date, 1));
                break;
        }
    };

    const formatDateLabel = () => {
        switch (view) {
            case 'day':
                return format(date, 'EEEE, d MMMM yyyy', { locale: pl });
            case 'week':
                return format(date, "'Tydzień' w, MMMM yyyy", { locale: pl });
            case 'month':
                return format(date, 'MMMM yyyy', { locale: pl });
        }
    };

    return (
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center gap-4">
                <button
                    onClick={onTodayClick}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Dzisiaj
                </button>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handlePrev}
                        className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
                        aria-label="Poprzedni"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                    </button>
                    <button
                        onClick={handleNext}
                        className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
                        aria-label="Następny"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </button>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 capitalize">
                    {formatDateLabel()}
                </h2>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex rounded-md border border-gray-300 bg-white">
                    <button
                        onClick={() => onViewChange('day')}
                        className={`px-3 py-1.5 text-sm font-medium ${
                            view === 'day'
                                ? 'bg-primary text-white'
                                : 'text-gray-700 hover:bg-gray-50'
                        } rounded-l-md`}
                    >
                        Dzień
                    </button>
                    <button
                        onClick={() => onViewChange('week')}
                        className={`border-l border-r border-gray-300 px-3 py-1.5 text-sm font-medium ${
                            view === 'week'
                                ? 'bg-primary text-white'
                                : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Tydzień
                    </button>
                    <button
                        onClick={() => onViewChange('month')}
                        className={`px-3 py-1.5 text-sm font-medium ${
                            view === 'month'
                                ? 'bg-primary text-white'
                                : 'text-gray-700 hover:bg-gray-50'
                        } rounded-r-md`}
                    >
                        Miesiąc
                    </button>
                </div>
            </div>
        </div>
    );
}
