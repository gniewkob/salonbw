'use client';

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

    const formatDateLabel = (short = false) => {
        switch (view) {
            case 'day':
                return format(
                    date,
                    short ? 'EEE, d MMM' : 'EEEE, d MMMM yyyy',
                    { locale: pl },
                );
            case 'week':
                return format(
                    date,
                    short ? "'Tydz.' w, MMM yyyy" : "'Tydzień' w, MMMM yyyy",
                    { locale: pl },
                );
            case 'month':
                return format(date, short ? 'MMM yyyy' : 'MMMM yyyy', {
                    locale: pl,
                });
        }
    };

    return (
        <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center justify-content-sm-between border-bottom border-secondary border-opacity-25 bg-white px-3 py-2 gap-2">
            {/* Navigation row: Dzisiaj + prev/date/next */}
            <div className="d-flex align-items-center gap-2">
                <button
                    onClick={onTodayClick}
                    className="btn btn-sm btn-outline-secondary fw-medium"
                    style={{ whiteSpace: 'nowrap' }}
                >
                    Dzisiaj
                </button>

                <div className="d-flex align-items-center flex-grow-1 justify-content-between justify-content-sm-start gap-1">
                    <button
                        onClick={handlePrev}
                        className="btn btn-sm btn-link text-muted p-1"
                        aria-label="Poprzedni"
                        style={{ lineHeight: 1 }}
                    >
                        <svg
                            style={{ width: 20, height: 20 }}
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

                    <h2
                        className="mb-0 fw-semibold text-dark text-capitalize"
                        style={{ fontSize: '0.95rem', whiteSpace: 'nowrap' }}
                    >
                        {/* Short on xs, full on sm+ */}
                        <span className="d-inline d-sm-none">
                            {formatDateLabel(true)}
                        </span>
                        <span className="d-none d-sm-inline">
                            {formatDateLabel(false)}
                        </span>
                    </h2>

                    <button
                        onClick={handleNext}
                        className="btn btn-sm btn-link text-muted p-1"
                        aria-label="Następny"
                        style={{ lineHeight: 1 }}
                    >
                        <svg
                            style={{ width: 20, height: 20 }}
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

                {currentTime && (
                    <span
                        className="d-none d-sm-inline fw-light text-primary"
                        style={{ fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                    >
                        {format(currentTime, 'HH:mm')}
                    </span>
                )}
            </div>

            {/* View toggle: Dzień | Tydzień | Miesiąc */}
            <div
                className="btn-group btn-group-sm"
                role="group"
                aria-label="Widok kalendarza"
            >
                <button
                    type="button"
                    onClick={() => onViewChange('day')}
                    className={`btn btn-sm ${view === 'day' ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                    Dzień
                </button>
                <button
                    type="button"
                    onClick={() => onViewChange('week')}
                    className={`btn btn-sm ${view === 'week' ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                    Tydzień
                </button>
                <button
                    type="button"
                    onClick={() => onViewChange('month')}
                    className={`btn btn-sm ${view === 'month' ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                    Miesiąc
                </button>
            </div>
        </div>
    );
}
