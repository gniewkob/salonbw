import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { PluginDef } from '@fullcalendar/core';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment } from '@/types';
import { useAppointmentsApi } from '@/api/appointments';
import { getCalendarPlugins } from '@/utils/calendarPlugins';
import { mapAppointmentsToEvents } from '@/utils/calendarMap';
import { appointmentFromEventClick } from '@/utils/calendarEventClick';

const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
    ssr: false,
    loading: () => (
        <div className="rounded border border-dashed p-6 text-sm text-gray-600">
            Loading calendar…
        </div>
    ),
});

const AppointmentDetailsModal = dynamic(
    () => import('@/components/AppointmentDetailsModal'),
    {
        loading: () => null,
        ssr: false,
    },
);

export default function EmployeeDashboard() {
    const { apiFetch } = useAuth();
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
            extendedProps?: { appointment: Appointment };
        }[]
    >([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selected, setSelected] = useState<Appointment | null>(null);

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

    useEffect(() => {
        let mounted = true;
        apiFetch<Appointment[]>('/appointments/me')
            .then((data) => {
                if (!mounted) return;
                setEvents(
                    mapAppointmentsToEvents(data).map((e) => ({
                        ...e,
                        extendedProps: {
                            ...(e.extendedProps || {}),
                            appointment:
                                (
                                    e.extendedProps as
                                        | { appointment?: Appointment }
                                        | undefined
                                )?.appointment ??
                                (data.find(
                                    (a) => String(a.id) === e.id,
                                ) as Appointment),
                        },
                    })),
                );
            })
            .catch(() => setEvents([]));
        return () => {
            mounted = false;
        };
    }, [apiFetch]);

    return (
        <RouteGuard roles={['employee']} permission="dashboard:employee">
            <DashboardLayout>
                {pluginLoadError ? (
                    <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {pluginLoadError}
                    </div>
                ) : calendarPlugins ? (
                    <FullCalendar
                        plugins={calendarPlugins}
                        initialView="timeGridWeek"
                        editable={false}
                        events={events as unknown as Record<string, unknown>[]}
                        eventClick={(info) => {
                            const ap = appointmentFromEventClick(info);
                            if (ap) {
                                setSelected(ap);
                                setDetailsOpen(true);
                            }
                        }}
                    />
                ) : (
                    <div className="rounded border border-dashed p-6 text-sm text-gray-600">
                        Preparing calendar…
                    </div>
                )}
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
                        }}
                        onComplete={async (id) => {
                            await api.complete(id);
                            setDetailsOpen(false);
                        }}
                    />
                ) : null}
            </DashboardLayout>
        </RouteGuard>
    );
}
