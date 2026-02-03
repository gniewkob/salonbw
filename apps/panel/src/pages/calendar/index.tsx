import { useState, useCallback, useEffect } from 'react';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';
import { CalendarView } from '@/components/calendar';
import { useCalendar, useCalendarMutations } from '@/hooks/useCalendar';
import { useEmployees } from '@/hooks/useEmployees';
import { useServices } from '@/hooks/useServices';
import type { CalendarEvent, CalendarView as CalendarViewType } from '@/types';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import type { ComponentProps, ComponentType } from 'react';

import type AppointmentFormComponent from '@/components/AppointmentForm';
type AppointmentFormProps = ComponentProps<typeof AppointmentFormComponent>;

const isTestEnv = process.env.NODE_ENV === 'test';

const AppointmentForm: ComponentType<AppointmentFormProps> = isTestEnv
    ? (require('@/components/AppointmentForm')
          .default as ComponentType<AppointmentFormProps>)
    : dynamic<AppointmentFormProps>(
          () => import('@/components/AppointmentForm'),
          {
              ssr: false,
              loading: () => (
                  <div className="p-4 text-sm text-gray-500">
                      Ładowanie formularza...
                  </div>
              ),
          },
      );

interface AppointmentFormPayload {
    serviceId: number;
    startTime: string;
    clientId?: number;
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState<CalendarViewType>('day');
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>(
        [],
    );
    const [formOpen, setFormOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
        null,
    );
    const [selectedStartTime, setSelectedStartTime] = useState<string>('');

    const { data: employees, loading: employeesLoading } = useEmployees();
    const { data: services } = useServices();

    const {
        data: calendarData,
        loading: calendarLoading,
        refetch,
    } = useCalendar({
        date: format(currentDate, 'yyyy-MM-dd'),
        view: currentView,
        employeeIds:
            selectedEmployeeIds.length > 0 ? selectedEmployeeIds : undefined,
        enabled: !employeesLoading,
    });

    const { rescheduleAppointment } = useCalendarMutations();

    // Initialize selected employees when data loads
    useEffect(() => {
        if (employees && selectedEmployeeIds.length === 0) {
            setSelectedEmployeeIds(employees.map((e) => e.id));
        }
    }, [employees, selectedEmployeeIds.length]);

    const handleEventClick = useCallback((event: CalendarEvent) => {
        setSelectedEvent(event);
        setSelectedStartTime(event.startTime);
        if (event.type === 'appointment') {
            setFormOpen(true);
        }
    }, []);

    const handleEventDrop = useCallback(
        async (
            eventId: number,
            newStart: Date,
            newEnd: Date,
            newEmployeeId?: number,
        ) => {
            try {
                await rescheduleAppointment.mutateAsync({
                    id: eventId,
                    startTime: newStart.toISOString(),
                    endTime: newEnd.toISOString(),
                    employeeId: newEmployeeId,
                });
                await refetch();
            } catch (error) {
                console.error('Failed to reschedule appointment:', error);
                alert('Nie udało się przesunąć wizyty. Spróbuj ponownie.');
            }
        },
        [rescheduleAppointment, refetch],
    );

    const handleDateSelect = useCallback((start: Date) => {
        setSelectedEvent(null);
        setSelectedStartTime(start.toISOString());
        setFormOpen(true);
    }, []);

    const handleFormSubmit = useCallback(
        async (data: AppointmentFormPayload) => {
            void data;
            // This would call the appropriate API to create/update appointment
            setFormOpen(false);
            setSelectedEvent(null);
            await refetch();
        },
        [refetch],
    );

    const handleFormClose = useCallback(() => {
        setFormOpen(false);
        setSelectedEvent(null);
    }, []);

    const calendarEmployees = calendarData?.employees ?? employees ?? [];

    return (
        <RouteGuard
            roles={['employee', 'receptionist', 'admin']}
            permission="nav:calendar"
        >
            <DashboardLayout>
                <div className="h-[calc(100vh-4rem)]">
                    <CalendarView
                        events={calendarData?.events ?? []}
                        employees={calendarEmployees}
                        loading={calendarLoading || employeesLoading}
                        onEventClick={handleEventClick}
                        onEventDrop={handleEventDrop}
                        onDateSelect={handleDateSelect}
                        onDateChange={setCurrentDate}
                        onViewChange={setCurrentView}
                        onEmployeeFilterChange={setSelectedEmployeeIds}
                        currentDate={currentDate}
                        currentView={currentView}
                        selectedEmployeeIds={selectedEmployeeIds}
                    />
                </div>

                {formOpen && services && (
                    <Modal open onClose={handleFormClose}>
                        <div className="p-4">
                            <h2 className="mb-4 text-lg font-semibold">
                                {selectedEvent
                                    ? 'Edytuj wizytę'
                                    : 'Nowa wizyta'}
                            </h2>
                            <AppointmentForm
                                services={services}
                                initial={{
                                    startTime: selectedStartTime,
                                }}
                                onSubmit={handleFormSubmit}
                                onCancel={handleFormClose}
                            />
                        </div>
                    </Modal>
                )}
            </DashboardLayout>
        </RouteGuard>
    );
}
