import type { CalendarView } from '@/types';
import {
    format,
    addDays,
    subDays,
    addWeeks,
    subWeeks,
    addMonths,
    subMonths,
    isToday,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { type ReactNode, useState, useEffect } from 'react';

interface CalendarHeaderProps {
    date: Date;
    view: CalendarView;
    onDateChange: (date: Date) => void;
    onViewChange: (view: CalendarView) => void;
    onTodayClick: () => void;
    extraAction?: ReactNode;
}

export default function CalendarHeader({
    date,
    view,
    onDateChange,
    onViewChange,
    onTodayClick,
    extraAction,
}: CalendarHeaderProps) {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    // Bootstrap's `.d-sm-block` loses the cascade to `.d-none` in the panel
    // bundle, which hid the desktop date label entirely (only the clock
    // showed). Drive the responsive label from matchMedia instead so it
    // never depends on that ordering.
    const [compact, setCompact] = useState(false);
    const viewingToday = isToday(date);

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia('(max-width: 575px)');
        const update = () => setCompact(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    const handlePrev = () => {
        switch (view) {
            case 'day':
            case 'reception':
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
            case 'reception':
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
            case 'reception':
                return format(date, 'EEEE, d MMMM', { locale: pl });
            case 'week':
                return format(date, "'Tydzień' w · MMMM yyyy", { locale: pl });
            case 'month':
                return format(date, 'LLLL yyyy', { locale: pl });
        }
    };

    const formatDateLabelShort = () => {
        switch (view) {
            case 'day':
            case 'reception':
                return format(date, 'EEE, d MMM', { locale: pl });
            case 'week':
                return format(date, "'Tydz.' w · MMM yyyy", { locale: pl });
            case 'month':
                return format(date, 'LLL yyyy', { locale: pl });
        }
    };

    const views: { key: CalendarView; label: string }[] = [
        { key: 'day', label: 'Dzień' },
        { key: 'week', label: 'Tydzień' },
        { key: 'month', label: 'Miesiąc' },
    ];

    const dateLabel = compact ? formatDateLabelShort() : formatDateLabel();

    return (
        <div className="salonbw-calendar-toolbar">
            <div className="salonbw-calendar-toolbar__left">
                <div
                    className="salonbw-calendar-view-toggle"
                    role="group"
                    aria-label="Widok kalendarza"
                >
                    {views.map(({ key, label }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onViewChange(key)}
                            className={
                                view === key
                                    ? 'salonbw-calendar-view-toggle__button is-active'
                                    : 'salonbw-calendar-view-toggle__button'
                            }
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={onTodayClick}
                    className="salonbw-calendar-today-button"
                >
                    Dzisiaj
                </button>
            </div>

            <div className="salonbw-calendar-toolbar__center">
                <button
                    type="button"
                    onClick={handlePrev}
                    className="salonbw-calendar-nav-button"
                    aria-label="Poprzedni"
                >
                    <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </button>

                <button
                    type="button"
                    onClick={onTodayClick}
                    className={
                        viewingToday
                            ? 'salonbw-calendar-date-pill is-today'
                            : 'salonbw-calendar-date-pill'
                    }
                    aria-label="Wróć do dziś"
                >
                    <span>{dateLabel}</span>
                    {currentTime && (
                        <small>{format(currentTime, 'HH:mm')}</small>
                    )}
                </button>

                <button
                    type="button"
                    onClick={handleNext}
                    className="salonbw-calendar-nav-button"
                    aria-label="Następny"
                >
                    <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </button>
            </div>

            <div className="salonbw-calendar-toolbar__right">{extraAction}</div>
        </div>
    );
}
