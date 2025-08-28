import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';
import AdminAppointmentForm from '@/components/AdminAppointmentForm';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { useAppointmentsApi } from '@/api/appointments';
import { Appointment, Employee } from '@/types';

import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction';
import type { EventDropArg, EventResizeDoneArg } from '@fullcalendar/core';

const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
    ssr: false,
});

export default function AdminSchedulerPage() {
    const { apiFetch } = useAuth();
    const { data: employees } = useEmployees();
    const { data: clients } = useClients();
    const { data: services } = useServices();
    const api = useAppointmentsApi();

    const [events, setEvents] = useState<
        {
            id: string;
            title: string;
            start: string;
            end?: string;
            backgroundColor?: string;
            extendedProps?: Record<string, unknown>;
        }[]
    >([]);
    const [range, setRange] = useState<{ start: string; end: string } | null>(
        null,
    );
    const [selectedEmployee, setSelectedEmployee] = useState<number | 'all'>(
        'all',
    );
    const [createOpen, setCreateOpen] = useState(false);
    const [createStart, setCreateStart] = useState('');

    const loadEvents = async (
        startIso: string,
        endIso: string,
        employeeId?: number | 'all',
    ) => {
        try {
            const params = new URLSearchParams({ from: startIso, to: endIso });
            if (employeeId && employeeId !== 'all')
                params.set('employeeId', String(employeeId));
            // Preferred endpoint (if backend supports): /appointments?from=&to=&employeeId=
            // Fallback to /appointments
            let data: Appointment[];
            try {
                data = await apiFetch<Appointment[]>(
                    `/appointments?${params.toString()}`,
                );
            } catch {
                data = await apiFetch<Appointment[]>('/appointments');
            }

            const svcMap = new Map((services ?? []).map((s) => [s.id, s]));
            const empMap = new Map((employees ?? []).map((e) => [e.id, e]));

            const mapped = data
                .filter((a) =>
                    employeeId && employeeId !== 'all'
                        ? a.employee?.id === employeeId
                        : true,
                )
                .map((a) => {
                    const svc = a.service?.id
                        ? svcMap.get(a.service.id)
                        : undefined;
                    const emp: Employee | undefined = a.employee?.id
                        ? empMap.get(a.employee.id)
                        : undefined;
                    const end = a as unknown as { endTime?: string };
                    const title = `${a.client?.name ?? ''}${a.client?.name ? ' – ' : ''}${a.service?.name ?? ''}${emp?.name ? ` (${emp.name})` : ''}`;
                    return {
                        id: String(a.id),
                        title: title || `#${a.id}`,
                        start: a.startTime,
                        end: end.endTime,
                        backgroundColor: '#c5a880',
                        extendedProps: {
                            appointment: a,
                            service: svc as unknown as Record<string, unknown>,
                            employee: emp as unknown as Record<string, unknown>,
                        },
                    };
                });
            setEvents(mapped);
        } catch {
            setEvents([]);
        }
    };

    useEffect(() => {
        if (range) void loadEvents(range.start, range.end, selectedEmployee);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        JSON.stringify(range),
        selectedEmployee,
        services?.length,
        employees?.length,
    ]);

    const onDatesSet = (arg: { startStr: string; endStr: string }) => {
        setRange({ start: arg.startStr, end: arg.endStr });
    };

    const onDateClick = (arg: DateClickArg) => {
        setCreateStart(arg.dateStr);
        setCreateOpen(true);
    };

    const onEventDrop = async (arg: EventDropArg) => {
        try {
            await api.update(Number(arg.event.id), {
                startTime: arg.event.start!.toISOString(),
            });
        } catch {
            arg.revert();
        }
    };

    const onEventResize = async (arg: EventResizeDoneArg) => {
        // We don’t persist end changes unless backend supports it. Revert on error.
        try {
            await api.update(Number(arg.event.id), {
                startTime: arg.event.start!.toISOString(),
            });
        } catch {
            arg.revert();
        }
    };

    const employeeOptions = useMemo(() => {
        if (!employees) return [] as { id: number; label: string }[];
        return employees.map((e) => ({
            id: e.id,
            label: e.name || e.fullName || `#${e.id}`,
        }));
    }, [employees]);

    return (
        <RouteGuard roles={['admin']}>
            <DashboardLayout>
                <div className="flex items-center gap-2 mb-2">
                    <label>Employee:</label>
                    <select
                        className="border p-1"
                        value={
                            selectedEmployee === 'all'
                                ? 'all'
                                : String(selectedEmployee)
                        }
                        onChange={(e) =>
                            setSelectedEmployee(
                                e.target.value === 'all'
                                    ? 'all'
                                    : Number(e.target.value),
                            )
                        }
                    >
                        <option value="all">All</option>
                        {employeeOptions.map((e) => (
                            <option key={e.id} value={e.id}>
                                {e.label}
                            </option>
                        ))}
                    </select>
                </div>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    editable
                    events={events}
                    dateClick={onDateClick}
                    eventDrop={(arg) => void onEventDrop(arg)}
                    eventResize={(arg) => void onEventResize(arg)}
                    datesSet={(arg) =>
                        onDatesSet({
                            startStr: arg.startStr,
                            endStr: arg.endStr,
                        })
                    }
                />
                <Modal open={createOpen} onClose={() => setCreateOpen(false)}>
                    {clients && employees && services && (
                        <AdminAppointmentForm
                            clients={clients}
                            employees={employees}
                            services={services}
                            initial={{ startTime: createStart }}
                            onCancel={() => setCreateOpen(false)}
                            onSubmit={async (data) => {
                                await api.create({
                                    employeeId: data.employeeId,
                                    serviceId: data.serviceId,
                                    startTime: data.startTime,
                                    clientId: data.clientId,
                                });
                                setCreateOpen(false);
                                if (range)
                                    void loadEvents(
                                        range.start,
                                        range.end,
                                        selectedEmployee,
                                    );
                            }}
                        />
                    )}
                </Modal>
            </DashboardLayout>
        </RouteGuard>
    );
}
