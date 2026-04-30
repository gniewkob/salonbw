import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import CalendarView from '@/components/calendar/CalendarView';
import AppointmentDrawer from '@/components/calendar/AppointmentDrawer';
import { useAuth } from '@/contexts/AuthContext';
import type {
    Appointment,
    CalendarEvent,
    CalendarView as CalendarViewType,
} from '@/types';
import { useCalendar, useCalendarMutations } from '@/hooks/useCalendar';

interface DrawerState {
    open: boolean;
    mode: 'create' | 'edit';
    appointment: Appointment | null;
    initialStartTime?: Date;
    initialEndTime?: Date;
    initialEmployeeId?: number;
}

function toDateParam(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function CalendarNextPage() {
    const router = useRouter();
    const { role } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState<CalendarViewType>('day');
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>(
        [],
    );
    const [drawer, setDrawer] = useState<DrawerState>({
        open: false,
        mode: 'create',
        appointment: null,
    });

    const { data, loading, refetch } = useCalendar({
        date: toDateParam(currentDate),
        view: currentView,
        employeeIds:
            selectedEmployeeIds.length > 0 ? selectedEmployeeIds : undefined,
    });
    const { rescheduleAppointment, checkConflicts } = useCalendarMutations();

    const appointmentsById = useMemo(() => {
        const map = new Map<number, Appointment>();
        for (const event of data?.events ?? []) {
            if (event.type !== 'appointment') continue;
            map.set(event.id, {
                id: event.id,
                startTime: event.startTime,
                endTime: event.endTime,
                status: event.status as Appointment['status'],
                client: event.clientId
                    ? { id: event.clientId, name: event.clientName ?? '-' }
                    : undefined,
                service: event.serviceId
                    ? {
                          id: event.serviceId,
                          name: event.serviceName ?? '-',
                          duration: 0,
                          price: 0,
                          priceType: 'fixed',
                          isActive: true,
                          onlineBooking: false,
                          sortOrder: 0,
                      }
                    : undefined,
                employee:
                    event.employeeId > 0
                        ? {
                              id: event.employeeId,
                              name: event.employeeName,
                          }
                        : undefined,
            });
        }
        return map;
    }, [data?.events]);

    const handleEventClick = (event: CalendarEvent) => {
        if (event.type !== 'appointment') return;
        const appointment = appointmentsById.get(event.id);

        setDrawer({
            open: true,
            mode: 'edit',
            appointment: appointment ?? null,
        });
    };

    useEffect(() => {
        const dateParam = Array.isArray(router.query.date)
            ? router.query.date[0]
            : router.query.date;
        if (!dateParam) return;
        const nextDate = new Date(dateParam);
        if (!Number.isNaN(nextDate.getTime())) {
            setCurrentDate(nextDate);
        }
    }, [router.query.date]);

    useEffect(() => {
        const idsParam = Array.isArray(router.query.employeeIds)
            ? router.query.employeeIds[0]
            : router.query.employeeIds;
        if (!idsParam) {
            setSelectedEmployeeIds([]);
            return;
        }
        const parsed = idsParam
            .split(',')
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value > 0);
        setSelectedEmployeeIds(parsed);
    }, [router.query.employeeIds]);

    useEffect(() => {
        const viewParam = Array.isArray(router.query.view)
            ? router.query.view[0]
            : router.query.view;
        if (
            viewParam === 'day' ||
            viewParam === 'week' ||
            viewParam === 'month' ||
            viewParam === 'reception'
        ) {
            setCurrentView(viewParam);
        }
    }, [router.query.view]);

    const updateCalendarQuery = (
        next: Partial<{
            date: string;
            view: CalendarViewType;
            employeeIds: number[];
        }>,
    ) => {
        const query = { ...router.query } as Record<string, string>;
        if (next.date !== undefined) query.date = next.date;
        if (next.view !== undefined) query.view = next.view;
        if (next.employeeIds !== undefined) {
            if (next.employeeIds.length > 0) {
                query.employeeIds = next.employeeIds.join(',');
            } else {
                delete query.employeeIds;
            }
        }
        void router.push({ pathname: router.pathname, query }, undefined, {
            shallow: true,
        });
    };

    const handleEventDrop = async (
        eventId: number,
        newStart: Date,
        newEnd: Date,
        newEmployeeId?: number,
        revert?: () => void,
    ) => {
        const event = (data?.events ?? []).find(
            (entry) => entry.id === eventId && entry.type === 'appointment',
        );
        if (!event) return;

        const targetEmployeeId = newEmployeeId ?? event.employeeId;
        const conflictCheck = await checkConflicts(
            targetEmployeeId,
            newStart.toISOString(),
            newEnd.toISOString(),
            eventId,
        );

        if (conflictCheck.hasConflict) {
            revert?.();
            await refetch();
            return;
        }

        await rescheduleAppointment.mutateAsync({
            id: eventId,
            startTime: newStart.toISOString(),
            endTime: newEnd.toISOString(),
            employeeId: targetEmployeeId,
        });
    };

    if (!role) return null;

    return (
        <RouteGuard permission="nav:calendar">
            <SalonShell role={role}>
                <div className="salonbw-page" data-testid="calendar-next-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_calendar"
                        items={[{ label: 'Kalendarz (Next)' }]}
                    />

                    <div className="d-flex align-items-center justify-content-between gap-2 px-3 pb-2">
                        <div className="small text-muted">
                            Natywny kalendarz Booksy-like (beta). Legacy:{' '}
                            <Link href="/calendar">/calendar</Link>
                        </div>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() =>
                                setDrawer({
                                    open: true,
                                    mode: 'create',
                                    appointment: null,
                                    initialStartTime: new Date(),
                                })
                            }
                        >
                            Nowa wizyta
                        </button>
                    </div>

                    <div className="px-3 pb-3">
                        <CalendarView
                            events={data?.events ?? []}
                            employees={data?.employees ?? []}
                            loading={loading}
                            onEventClick={handleEventClick}
                            onEventDrop={handleEventDrop}
                            onDateSelect={(start, end, employeeId) =>
                                setDrawer({
                                    open: true,
                                    mode: 'create',
                                    appointment: null,
                                    initialStartTime: start,
                                    initialEndTime: end,
                                    initialEmployeeId: employeeId,
                                })
                            }
                            onViewChange={(nextView) => {
                                setCurrentView(nextView);
                                updateCalendarQuery({ view: nextView });
                            }}
                            onEmployeeFilterChange={(ids) => {
                                setSelectedEmployeeIds(ids);
                                updateCalendarQuery({ employeeIds: ids });
                            }}
                            onDateChange={(date) => {
                                setCurrentDate(date);
                                updateCalendarQuery({
                                    date: toDateParam(date),
                                });
                            }}
                            currentDate={currentDate}
                            currentView={currentView}
                            selectedEmployeeIds={selectedEmployeeIds}
                            hideSidebar
                        />
                    </div>
                </div>

                <AppointmentDrawer
                    open={drawer.open}
                    mode={drawer.mode}
                    appointment={drawer.appointment}
                    initialStartTime={drawer.initialStartTime}
                    initialEndTime={drawer.initialEndTime}
                    initialEmployeeId={drawer.initialEmployeeId}
                    onClose={() =>
                        setDrawer((current) => ({
                            ...current,
                            open: false,
                        }))
                    }
                    onSaved={() => {
                        void refetch();
                    }}
                />
            </SalonShell>
        </RouteGuard>
    );
}
