import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment } from '@/types';
import AppointmentDetailsModal from '@/components/AppointmentDetailsModal';
import { useAppointmentsApi } from '@/api/appointments';
import { getCalendarPlugins } from '@/utils/calendarPlugins';
import { mapAppointmentsToEvents } from '@/utils/calendarMap';
import { appointmentFromEventClick } from '@/utils/calendarEventClick';

export default function EmployeeDashboard() {
    const { apiFetch } = useAuth();
    const api = useAppointmentsApi();
    const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
        ssr: false,
    });
    const plugins = getCalendarPlugins();

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
                <FullCalendar
                    plugins={plugins}
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
            </DashboardLayout>
        </RouteGuard>
    );
}
