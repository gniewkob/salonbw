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
    const viewingToday = isToday(date);

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60);
        return () => clearInterval(timer);
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

    return (
        <div
            className="bg-white border-bottom"
            style={{ borderColor: '#e9ecef' }}
        >
            <div className="d-flex align-items-center justify-content-between px-3 py-2 gap-2">
                {/* Left: nav arrows + date label */}
                <div className="d-flex align-items-center gap-1 min-w-0">
                    <button
                        type="button"
                        onClick={handlePrev}
                        className="btn btn-sm btn-light border-0 text-secondary p-2 flex-shrink-0"
                        aria-label="Poprzedni"
                        style={{ lineHeight: 1, borderRadius: 8 }}
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
                        className="btn btn-sm border-0 px-2 py-1 text-start flex-shrink-0"
                        style={{ background: 'none', lineHeight: 1.2 }}
                        aria-label="Wróć do dziś"
                    >
                        <span
                            className="d-none d-sm-block fw-semibold text-capitalize"
                            style={{
                                fontSize: '1.05rem',
                                color: viewingToday ? '#0d0d0d' : '#6e7278',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {formatDateLabel()}
                        </span>
                        <span
                            className="d-block d-sm-none fw-semibold text-capitalize"
                            style={{
                                fontSize: '0.95rem',
                                color: viewingToday ? '#0d0d0d' : '#6e7278',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {formatDateLabelShort()}
                        </span>
                        {!viewingToday && (
                            <span
                                className="d-none d-sm-block"
                                style={{
                                    fontSize: '0.72rem',
                                    marginTop: 1,
                                    color: '#6e7278',
                                }}
                            >
                                Kliknij, by wrócić do dziś
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleNext}
                        className="btn btn-sm btn-light border-0 text-secondary p-2 flex-shrink-0"
                        aria-label="Następny"
                        style={{ lineHeight: 1, borderRadius: 8 }}
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

                    {currentTime && (
                        <span
                            className="d-none d-md-inline text-secondary ms-1"
                            style={{ fontSize: '0.82rem' }}
                        >
                            {format(currentTime, 'HH:mm')}
                        </span>
                    )}
                </div>

                {/* Right: view toggle + extra action */}
                <div className="d-flex align-items-center gap-2 flex-shrink-0">
                    {extraAction}

                    <div
                        className="d-flex align-items-center gap-1"
                        style={{
                            background: '#f1f3f5',
                            borderRadius: 10,
                            padding: '3px',
                        }}
                        role="group"
                        aria-label="Widok kalendarza"
                    >
                        {views.map(({ key, label }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => onViewChange(key)}
                                className={`btn btn-sm border-0 px-2 py-1${view === key ? ' shadow-sm' : ''}`}
                                style={{
                                    fontSize: '0.8rem',
                                    fontWeight: view === key ? 600 : 400,
                                    borderRadius: 7,
                                    background:
                                        view === key
                                            ? '#ffffff'
                                            : 'transparent',
                                    color: view === key ? '#212529' : '#6c757d',
                                    transition: 'background 0.15s, color 0.15s',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
