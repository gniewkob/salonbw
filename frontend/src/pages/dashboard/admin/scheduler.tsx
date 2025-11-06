import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type { PluginDef } from '@fullcalendar/core';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
// We'll fetch users with role filters directly from /users?role=...
import { useServices } from '@/hooks/useServices';
import { useAppointmentsApi } from '@/api/appointments';
import { Appointment, Employee } from '@/types';
import { mapAppointmentsToEvents } from '@/utils/calendarMap';
import { getCalendarPlugins } from '@/utils/calendarPlugins';

type SimpleUser = { id: number; name: string };

import type { DateClickArg } from '@fullcalendar/interaction';
import type { EventDropArg } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';

import type AdminAppointmentFormComponent from '@/components/AdminAppointmentForm';
import type AppointmentDetailsModalComponent from '@/components/AppointmentDetailsModal';

type AdminAppointmentFormProps = ComponentProps<
    typeof AdminAppointmentFormComponent
>;
type AppointmentDetailsModalProps = ComponentProps<
    typeof AppointmentDetailsModalComponent
>;

const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
    ssr: false,
    loading: () => (
        <div className="rounded border border-dashed p-6 text-sm text-gray-600">
            Loading calendar…
        </div>
    ),
});

const AdminAppointmentForm = dynamic<AdminAppointmentFormProps>(
    () => import('@/components/AdminAppointmentForm'),
    {
        ssr: false,
        loading: () => (
            <div className="p-4 text-sm text-gray-500">
                Loading appointment form…
            </div>
        ),
    },
);

const AppointmentDetailsModal = dynamic<AppointmentDetailsModalProps>(
    () => import('@/components/AppointmentDetailsModal'),
    {
        ssr: false,
        loading: () => null,
    },
);

export default function AdminSchedulerPage() {
    const { apiFetch } = useAuth();
    const [employees, setEmployees] = useState<Employee[] | null>(null);
    const [clients, setClients] = useState<SimpleUser[] | null>(null);
    const { data: services } = useServices();
    const api = useAppointmentsApi();

    const [calendarPlugins, setCalendarPlugins] = useState<PluginDef[] | null>(
        null,
    );
    const [pluginLoadError, setPluginLoadError] = useState<string | null>(null);

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
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selected, setSelected] = useState<Appointment | null>(null);

    const loadEvents = useCallback(
        async (
            startIso: string,
            endIso: string,
            employeeId?: number | 'all',
        ) => {
            try {
                const params = new URLSearchParams({
                    from: startIso,
                    to: endIso,
                });
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

                const mapped = mapAppointmentsToEvents(
                    data,
                    services ?? [],
                    (employees ?? []) as Employee[],
                    employeeId ?? 'all',
                );
                setEvents(mapped);
            } catch {
                setEvents([]);
            }
        },
        [apiFetch, services, employees],
    );

    useEffect(() => {
        if (range) void loadEvents(range.start, range.end, selectedEmployee);
    }, [range, selectedEmployee, loadEvents]);

    useEffect(() => {
        let mounted = true;
        const loadUsers = async () => {
            try {
                const emps = await apiFetch<Employee[]>(`/users?role=employee`);
                const cls = await apiFetch<SimpleUser[]>(`/users?role=client`);
                if (mounted) {
                    setEmployees(emps);
                    setClients(cls);
                }
            } catch {
                if (mounted) {
                    setEmployees([]);
                    setClients([]);
                }
            }
        };
        void loadUsers();
        return () => {
            mounted = false;
        };
    }, [apiFetch]);

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

    useEffect(() => {
        let mounted = true;
        void getCalendarPlugins()
            .then((plugins) => {
                if (mounted) {
                    setCalendarPlugins(plugins);
                    setPluginLoadError(null);
                }
            })
            .catch((error) => {
                if (!mounted) return;
                setPluginLoadError(
                    error instanceof Error
                        ? error.message
                        : 'Failed to load calendar',
                );
                setCalendarPlugins([]);
            });
        return () => {
            mounted = false;
        };
    }, []);

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
                {pluginLoadError ? (
                    <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {pluginLoadError}
                    </div>
                ) : calendarPlugins ? (
                    <FullCalendar
                        plugins={calendarPlugins}
                        initialView="timeGridWeek"
                        editable
                        events={events}
                        dateClick={onDateClick}
                        eventClick={(info) => {
                            // prettier-ignore
                            const ap = (info.event.extendedProps as { appointment: Appointment; }).appointment;
                            setSelected(ap);
                            setDetailsOpen(true);
                        }}
                        eventDrop={(arg) => void onEventDrop(arg)}
                        eventResize={(arg) => void onEventResize(arg)}
                        datesSet={(arg) =>
                            onDatesSet({
                                startStr: arg.startStr,
                                endStr: arg.endStr,
                            })
                        }
                    />
                ) : (
                    <div className="rounded border border-dashed p-6 text-sm text-gray-600">
                        Preparing calendar…
                    </div>
                )}
                <div className="mt-2 flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1">
                        <span
                            className="inline-block w-3 h-3 rounded"
                            style={{ background: '#16a34a' }}
                        />
                        Completed
                    </span>
                    <span className="flex items-center gap-1">
                        <span
                            className="inline-block w-3 h-3 rounded"
                            style={{ background: '#9ca3af' }}
                        />
                        Cancelled
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded bg-blue-400" />
                        Scheduled (by employee)
                    </span>
                </div>
                {createOpen ? (
                    <Modal open onClose={() => setCreateOpen(false)}>
                        {clients && employees && services ? (
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
                        ) : (
                            <div className="p-4 text-sm text-gray-500">
                                Loading data…
                            </div>
                        )}
                    </Modal>
                ) : null}
                {detailsOpen && selected ? (
                    <AppointmentDetailsModal
                        open={detailsOpen}
                        onClose={() => setDetailsOpen(false)}
                        appointment={selected}
                        canCancel
                        canComplete
                        onCancel={async (id) => {
                            await api.cancel(id);
                            setDetailsOpen(false);
                            if (range)
                                void loadEvents(
                                    range.start,
                                    range.end,
                                    selectedEmployee,
                                );
                        }}
                        onComplete={async (id) => {
                            await api.complete(id);
                            setDetailsOpen(false);
                            if (range)
                                void loadEvents(
                                    range.start,
                                    range.end,
                                    selectedEmployee,
                                );
                        }}
                    />
                ) : null}
            </DashboardLayout>
        </RouteGuard>
    );
}
