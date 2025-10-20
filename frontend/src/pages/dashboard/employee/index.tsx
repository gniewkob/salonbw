import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment } from '@/types';
import AppointmentDetailsModal from '@/components/AppointmentDetailsModal';
import { useAppointmentsApi } from '@/api/appointments';

export default function EmployeeDashboard() {
    const { apiFetch } = useAuth();
    const api = useAppointmentsApi();
    const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
        ssr: false,
    });
    const dayGridPlugin = require('@fullcalendar/daygrid').default;
    const timeGridPlugin = require('@fullcalendar/timegrid').default;
    const interactionPlugin = require('@fullcalendar/interaction').default;

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
                    data.map((a) => ({
                        id: String(a.id),
                        title: a.service?.name
                            ? `${a.service.name} – ${a.client?.name ?? ''}`
                            : `#${a.id}`,
                        start: a.startTime,
                        extendedProps: { appointment: a },
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
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    editable={false}
                    events={events as unknown as Record<string, unknown>[]}
                    eventClick={(info) => {
                        // prettier-ignore
                        const ap = (info.event.extendedProps as { appointment: Appointment; }).appointment;
                        setSelected(ap);
                        setDetailsOpen(true);
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
