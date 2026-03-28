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
import { useState, useEffect } from 'react';

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
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60);
        return () => clearInterval(timer);
    }, []);

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
        <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 bg-white px-3 py-2">
            <div className="d-flex align-items-center gap-3">
                <button
                    onClick={onTodayClick}
                    className="rounded-2 border border-secondary border-opacity-50 bg-white px-3 py-1 small fw-medium text-body"
                >
                    Dzisiaj
                </button>
                <div className="d-flex align-items-center gap-1">
                    <button
                        onClick={handlePrev}
                        className="rounded-2 p-1 text-muted"
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
                        className="rounded-2 p-1 text-muted"
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
                <div className="d-flex align-items-baseline gap-2">
                    <h2 className="fs-5 fw-semibold text-dark text-capitalize">
                        {formatDateLabel()}
                    </h2>
                    {currentTime && (
                        <span className="fs-5 fw-light text-primary">
                            {format(currentTime, 'HH:mm')}
                        </span>
                    )}
                </div>
            </div>

            <div className="d-flex align-items-center gap-2">
                <div className="d-flex rounded-2 border border-secondary border-opacity-50 bg-white">
                    <button
                        onClick={() => onViewChange('day')}
                        className={`px-3 py-1 small fw-medium ${
                            view === 'day'
                                ? 'bg-primary text-white'
                                : 'text-body '
                        } rounded-l-md`}
                    >
                        Dzień
                    </button>
                    <button
                        onClick={() => onViewChange('week')}
                        className={`border-start border-end border-secondary border-opacity-50 px-3 py-1 small fw-medium ${
                            view === 'week'
                                ? 'bg-primary text-white'
                                : 'text-body '
                        }`}
                    >
                        Tydzień
                    </button>
                    <button
                        onClick={() => onViewChange('month')}
                        className={`px-3 py-1 small fw-medium ${
                            view === 'month'
                                ? 'bg-primary text-white'
                                : 'text-body '
                        } rounded-r-md`}
                    >
                        Miesiąc
                    </button>
                </div>
            </div>
        </div>
    );
}
