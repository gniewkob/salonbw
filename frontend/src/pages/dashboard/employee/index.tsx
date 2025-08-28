import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment } from '@/types';

export default function EmployeeDashboard() {
    const { apiFetch } = useAuth();
    const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
        ssr: false,
    });
    const dayGridPlugin = require('@fullcalendar/daygrid').default;
    const timeGridPlugin = require('@fullcalendar/timegrid').default;
    const interactionPlugin = require('@fullcalendar/interaction').default;

    const [events, setEvents] = useState<
        { id: string; title: string; start: string }[]
    >([]);

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
                    })),
                );
            })
            .catch(() => setEvents([]));
        return () => {
            mounted = false;
        };
    }, [apiFetch]);

    return (
        <RouteGuard roles={['employee']}>
            <DashboardLayout>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    editable={false}
                    events={events}
                />
            </DashboardLayout>
        </RouteGuard>
    );
}
