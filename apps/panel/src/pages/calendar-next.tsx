import { useMemo, useState } from 'react';
import Link from 'next/link';
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

    if (!role) return null;

    const handleEventClick = (event: CalendarEvent) => {
        if (event.type !== 'appointment') return;
        const appointment = appointmentsById.get(event.id);

        setDrawer({
            open: true,
            mode: 'edit',
            appointment: appointment ?? null,
        });
    };

    const handleEventDrop = async (
        eventId: number,
        newStart: Date,
        newEnd: Date,
        newEmployeeId?: number,
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
            alert('Konflikt kalendarza: pracownik ma już wizytę w tym czasie.');
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
                            onDateChange={setCurrentDate}
                            onViewChange={setCurrentView}
                            onEmployeeFilterChange={setSelectedEmployeeIds}
                            currentDate={currentDate}
                            currentView={currentView}
                            selectedEmployeeIds={selectedEmployeeIds}
                            hideSidebar={false}
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
