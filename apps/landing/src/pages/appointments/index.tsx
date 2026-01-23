import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';
import { useAppointments, useMyAppointments } from '@/hooks/useAppointments';
import { useServices } from '@/hooks/useServices';
import { useAppointmentsApi } from '@/api/appointments';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
import type { ComponentProps, ComponentType } from 'react';
import type { PluginDef } from '@fullcalendar/core';
import type { DateClickArg } from '@fullcalendar/interaction';
import type { EventClickArg, EventDropArg } from '@fullcalendar/core';
import type { paths } from '@salonbw/api';
import { useEffect, useMemo, useState } from 'react';
import { getCalendarPlugins } from '@/utils/calendarPlugins';

const isTestEnv = process.env.NODE_ENV === 'test';

const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
    ssr: false,
    loading: () => (
        <div className="rounded border border-dashed p-6 text-sm text-gray-600">
            Loading calendar…
        </div>
    ),
});

import type AppointmentFormComponent from '@/components/AppointmentForm';

type AppointmentFormProps = ComponentProps<typeof AppointmentFormComponent>;

const AppointmentForm: ComponentType<AppointmentFormProps> = isTestEnv
    ? // eslint-disable-next-line global-require
      (require('@/components/AppointmentForm')
          .default as ComponentType<AppointmentFormProps>)
    : dynamic<AppointmentFormProps>(
          () => import('@/components/AppointmentForm'),
          {
              ssr: false,
              loading: () => (
                  <div className="p-4 text-sm text-gray-500">Loading form…</div>
              ),
          },
      );

type CreateAppointmentPayload =
    paths['/appointments']['post']['requestBody']['content']['application/json'];
type UpdateAppointmentPayload =
    paths['/appointments/{id}']['patch']['requestBody']['content']['application/json'];

interface AppointmentFormPayload {
    serviceId: number;
    startTime: string;
    clientId?: number;
}

export default function AppointmentsPage() {
    const { role } = useAuth();
    const isAdmin = role === 'admin';

    // Admin sees all appointments, others see only their own
    // Use enabled option to prevent unnecessary API calls
    const allAppointments = useAppointments({ enabled: isAdmin });
    const myAppointments = useMyAppointments({ enabled: !isAdmin });
    const {
        data: appointments,
        loading,
        error,
    } = isAdmin ? allAppointments : myAppointments;

    const { data: services } = useServices();
    const api = useAppointmentsApi();
    const [formOpen, setFormOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [startTime, setStartTime] = useState('');
    const [calendarPlugins, setCalendarPlugins] = useState<PluginDef[] | null>(
        isTestEnv ? [] : null,
    );
    const [pluginLoadError, setPluginLoadError] = useState<string | null>(null);

    useEffect(() => {
        if (isTestEnv) {
            setPluginLoadError(null);
            return;
        }
        let mounted = true;
        void getCalendarPlugins()
            .then((plugins) => {
                if (mounted) {
                    setCalendarPlugins(plugins);
                    setPluginLoadError(null);
                }
            })
            .catch((err) => {
                if (!mounted) return;
                setPluginLoadError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to load calendar',
                );
                setCalendarPlugins([]);
            });
        return () => {
            mounted = false;
        };
    }, []);

    const events = useMemo(
        () =>
            appointments?.map((a) => ({
                id: String(a.id),
                title: a.client?.name ?? String(a.id),
                start: a.startTime,
            })) ?? [],
        [appointments],
    );

    if (loading || !services) return <div>Loading...</div>;
    if (error) return <div>Error</div>;

    const handleDateClick = (arg: DateClickArg) => {
        setEditId(null);
        setStartTime(arg.dateStr);
        setFormOpen(true);
    };

    const handleEventClick = (info: EventClickArg) => {
        setEditId(Number(info.event.id));
        setStartTime(info.event.startStr);
        setFormOpen(true);
    };

    const handleDrop = async (arg: EventDropArg): Promise<void> => {
        try {
            const payload: UpdateAppointmentPayload = {
                startTime: arg.event.start!.toISOString(),
            };
            await api.update(Number(arg.event.id), payload);
        } catch {
            alert('Conflict');
            arg.revert();
        }
    };

    const handleSubmit = async (
        data: AppointmentFormPayload,
    ): Promise<void> => {
        if (editId) {
            await api.update(editId, { startTime: data.startTime });
        } else {
            const payload: CreateAppointmentPayload = {
                serviceId: data.serviceId,
                startTime: data.startTime,
                employeeId: 1,
                ...(data.clientId ? { clientId: data.clientId } : {}),
            };
            await api.create(payload);
        }
        setFormOpen(false);
    };

    return (
        <RouteGuard
            roles={['client', 'employee', 'receptionist', 'admin']}
            permission="nav:appointments"
        >
            <DashboardLayout>
                {role === 'receptionist' && (
                    <div>Viewing appointments for all employees</div>
                )}
                {pluginLoadError ? (
                    <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {pluginLoadError}
                    </div>
                ) : calendarPlugins ? (
                    <FullCalendar
                        plugins={calendarPlugins}
                        initialView="timeGridWeek"
                        events={events}
                        dateClick={handleDateClick}
                        eventClick={handleEventClick}
                        eventDrop={(arg) => {
                            void handleDrop(arg);
                        }}
                        editable
                    />
                ) : (
                    <div className="rounded border border-dashed p-6 text-sm text-gray-600">
                        Preparing calendar…
                    </div>
                )}
                {formOpen ? (
                    <Modal open onClose={() => setFormOpen(false)}>
                        <AppointmentForm
                            services={services}
                            initial={{ startTime }}
                            onSubmit={handleSubmit}
                            onCancel={() => setFormOpen(false)}
                        />
                    </Modal>
                ) : null}
            </DashboardLayout>
        </RouteGuard>
    );
}
