'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
    format,
    addDays,
    subDays,
    addWeeks,
    subWeeks,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    isSameDay,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import CalendarView from '@/components/calendar/CalendarView';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useAppointments } from '@/hooks/useAppointments';
import type { CalendarView as ViewType } from '@/types';
import ReceptionView from '@/components/calendar/ReceptionView';

export default function CalendarPage() {
    const { role } = useAuth();
    const router = useRouter();
    const { date: dateParam, employeeId: employeeIdParam } = router.query;

    // State
    const [view, setView] = useState<ViewType>('day');
    const [currentDate, setCurrentDate] = useState(
        dateParam ? new Date(dateParam as string) : new Date(),
    );

    // Handle employee selection from URL
    const selectedEmployeeIds = employeeIdParam
        ? [Number(employeeIdParam)]
        : [];

    // Data
    const { data: employees = [] } = useEmployees();

    // Calculate date range based on view
    const getDateRange = () => {
        switch (view) {
            case 'day':
            case 'reception':
                return {
                    from: currentDate.toISOString().split('T')[0],
                    to: currentDate.toISOString().split('T')[0],
                };
            case 'week': {
                const start = startOfWeek(currentDate, { weekStartsOn: 1 });
                const end = endOfWeek(currentDate, { weekStartsOn: 1 });
                return {
                    from: start.toISOString().split('T')[0],
                    to: end.toISOString().split('T')[0],
                };
            }
            case 'month': {
                const start = startOfMonth(currentDate);
                const end = endOfMonth(currentDate);
                return {
                    from: start.toISOString().split('T')[0],
                    to: end.toISOString().split('T')[0],
                };
            }
            default:
                return {
                    from: currentDate.toISOString().split('T')[0],
                    to: currentDate.toISOString().split('T')[0],
                };
        }
    };

    const dateRange = getDateRange();
    const { data: appointmentData, loading } = useAppointments(
        dateRange.from,
        dateRange.to,
    );

    // Navigation handlers
    const navigateDate = (direction: 'prev' | 'next') => {
        let newDate: Date;
        switch (view) {
            case 'day':
                newDate =
                    direction === 'prev'
                        ? subDays(currentDate, 1)
                        : addDays(currentDate, 1);
                break;
            case 'week':
                newDate =
                    direction === 'prev'
                        ? subWeeks(currentDate, 1)
                        : addWeeks(currentDate, 1);
                break;
            case 'month':
                newDate =
                    direction === 'prev'
                        ? subMonths(currentDate, 1)
                        : addMonths(currentDate, 1);
                break;
            default:
                newDate = currentDate;
        }
        handleDateChange(newDate);
    };

    const goToToday = () => {
        handleDateChange(new Date());
    };

    // Handlers
    const handleDateChange = useCallback(
        (date: Date) => {
            setCurrentDate(date);
            const query = { ...router.query, date: format(date, 'yyyy-MM-dd') };
            void router.push({ pathname: router.pathname, query }, undefined, {
                shallow: true,
            });
        },
        [router],
    );

    const handleEventDrop = async (id: number, start: Date, end: Date) => {
        console.log('Update appointment', id, start, end);
        // TODO: Implement API call
    };

    const isToday = isSameDay(currentDate, new Date());

    // Format header date like "sobota, 7 lutego 2026"
    const headerDate = format(currentDate, 'eeee, d MMMM yyyy', { locale: pl });

    if (!role) return null;

    return (
        <RouteGuard
            roles={['client', 'employee', 'receptionist', 'admin']}
            permission="nav:appointments"
        >
            <VersumShell role={role}>
                <div className="versum-calendar-page">
                    {/* Calendar Header - Versum Style */}
                    <div className="versum-calendar-header">
                        <div className="versum-calendar-header__left">
                            <button
                                className="versum-calendar-header__nav-btn"
                                onClick={() => navigateDate('prev')}
                                title="Poprzedni"
                            >
                                <span className="versum-icon">&#xe900;</span>
                            </button>
                            <button
                                className="versum-calendar-header__nav-btn"
                                onClick={() => navigateDate('next')}
                                title="Następny"
                            >
                                <span className="versum-icon">&#xe901;</span>
                            </button>
                            <button
                                className={`versum-calendar-header__today-btn ${isToday ? 'disabled' : ''}`}
                                onClick={goToToday}
                                disabled={isToday}
                            >
                                dzisiaj
                            </button>
                            <a
                                href="javascript:;"
                                className="versum-calendar-header__print-link"
                                onClick={() => alert('Funkcja w przygotowaniu')}
                            >
                                drukuj rozkład dnia (PDF)
                            </a>
                        </div>

                        <h2 className="versum-calendar-header__title">
                            {headerDate}
                        </h2>

                        <div className="versum-calendar-header__right">
                            <div className="versum-calendar-header__view-switcher">
                                <button
                                    className={`versum-calendar-header__view-btn ${view === 'month' ? 'active' : ''}`}
                                    onClick={() => setView('month')}
                                >
                                    miesiąc
                                </button>
                                <button
                                    className={`versum-calendar-header__view-btn ${view === 'week' ? 'active' : ''}`}
                                    onClick={() => setView('week')}
                                >
                                    tydzień
                                </button>
                                <button
                                    className={`versum-calendar-header__view-btn ${view === 'day' ? 'active' : ''}`}
                                    onClick={() => setView('day')}
                                >
                                    dzień
                                </button>
                                <button
                                    className="versum-calendar-header__view-btn versum-calendar-header__view-btn--reception"
                                    onClick={() => setView('reception')}
                                    className={`versum-calendar-header__view-btn versum-calendar-header__view-btn--reception ${view === 'reception' ? 'active' : ''}`}
                                >
                                    recepcja
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Calendar Content */}
                    <div className="versum-calendar-content">
                        {view === 'reception' ? (
                            <ReceptionView
                                appointments={appointmentData || []}
                                loading={loading}
                            />
                        ) : (
                            <CalendarView
                                events={appointmentData || []}
                                employees={employees}
                                loading={loading}
                                currentDate={currentDate}
                                currentView={view}
                                selectedEmployeeIds={selectedEmployeeIds}
                                hideSidebar={true}
                                onEventClick={(e) => console.log('Click', e)}
                                onEventDrop={handleEventDrop}
                                onDateSelect={(start, end) =>
                                    console.log('Select', start, end)
                                }
                                onDateChange={handleDateChange}
                                onViewChange={setView}
                                onEmployeeFilterChange={(ids) => {
                                    const query = { ...router.query };
                                    if (ids.length === 0) {
                                        delete query.employeeId;
                                    } else {
                                        query.employeeId = String(ids[0]);
                                    }
                                    void router.push(
                                        { pathname: router.pathname, query },
                                        undefined,
                                        { shallow: true },
                                    );
                                }}
                            />
                        )}
                    </div>
                </div>
            </VersumShell>
        </RouteGuard>
    );
}
