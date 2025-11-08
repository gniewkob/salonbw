import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { PluginDef } from '@fullcalendar/core';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import StatsWidget from '@/components/StatsWidget';
import { useDashboard } from '@/hooks/useDashboard';
import { useAppointments } from '@/hooks/useAppointments';
import { mapAppointmentsToEvents } from '@/utils/calendarMap';
import { getCalendarPlugins } from '@/utils/calendarPlugins';
import type { Appointment } from '@/types';

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
        ssr: false,
        loading: () => null,
    },
);

export default function ReceptionistDashboard() {
    const { data, loading } = useDashboard();
    const { data: appointments, loading: appointmentsLoading } =
        useAppointments();
    const [calendarPlugins, setCalendarPlugins] = useState<PluginDef[] | null>(
        null,
    );
    const [pluginLoadError, setPluginLoadError] = useState<string | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selected, setSelected] = useState<Appointment | null>(null);

    useEffect(() => {
        let mounted = true;
        void getCalendarPlugins()
            .then((plugins) => {
                if (!mounted) return;
                setCalendarPlugins(plugins);
                setPluginLoadError(null);
            })
            .catch((error) => {
                if (!mounted) return;
                setPluginLoadError(
                    error instanceof Error
                        ? error.message
                        : 'Failed to load calendar plugins',
                );
                setCalendarPlugins([]);
            });
        return () => {
            mounted = false;
        };
    }, []);

    const events = useMemo(
        () => mapAppointmentsToEvents(appointments ?? []),
        [appointments],
    );

    return (
        <RouteGuard
            roles={['receptionist']}
            permission="dashboard:receptionist"
        >
            <DashboardLayout>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <StatsWidget
                        title="All Appointments"
                        value={data?.todayAppointments ?? null}
                        loading={loading}
                    />
                </div>
                <div className="mt-6">
                    {pluginLoadError ? (
                        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {pluginLoadError}
                        </div>
                    ) : !calendarPlugins ? (
                        <div className="rounded border border-dashed p-6 text-sm text-gray-600">
                            Preparing calendar…
                        </div>
                    ) : (
                        <FullCalendar
                            plugins={calendarPlugins}
                            initialView="timeGridWeek"
                            events={
                                events as unknown as Record<string, unknown>[]
                            }
                            eventClick={(info) => {
                                const ap = info.event.extendedProps
                                    ?.appointment as Appointment | undefined;
                                if (ap) {
                                    setSelected(ap);
                                    setDetailsOpen(true);
                                }
                            }}
                            height="auto"
                        />
                    )}
                </div>
                {detailsOpen && selected ? (
                    <AppointmentDetailsModal
                        open={detailsOpen}
                        onClose={() => setDetailsOpen(false)}
                        appointment={selected}
                    />
                ) : null}
                {appointmentsLoading && (
                    <div className="mt-4 text-sm text-gray-500">
                        Syncing appointments…
                    </div>
                )}
            </DashboardLayout>
        </RouteGuard>
    );
}
