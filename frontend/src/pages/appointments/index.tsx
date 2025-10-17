import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';
import AppointmentForm from '@/components/AppointmentForm';
import { useAppointments } from '@/hooks/useAppointments';
import { useServices } from '@/hooks/useServices';
import { useAppointmentsApi } from '@/api/appointments';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction';
import type { EventClickArg, EventDropArg } from '@fullcalendar/core';
import type { paths } from '@salonbw/api';

const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
    ssr: false,
});
import { useState } from 'react';

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
    const { data: appointments, loading, error } = useAppointments();
    const { data: services } = useServices();
    const api = useAppointmentsApi();
    const { role } = useAuth();
    const [formOpen, setFormOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [startTime, setStartTime] = useState('');

    if (loading || !services) return <div>Loading...</div>;
    if (error) return <div>Error</div>;

    const events = appointments?.map((a) => ({
        id: String(a.id),
        title: a.client?.name ?? String(a.id),
        start: a.startTime,
    }));

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
        <RouteGuard roles={['client', 'employee', 'receptionist', 'admin']}>
            <DashboardLayout>
                {role === 'receptionist' && (
                    <div>Viewing appointments for all employees</div>
                )}
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    events={events}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    eventDrop={(arg) => {
                        void handleDrop(arg);
                    }}
                    editable
                />
                <Modal open={formOpen} onClose={() => setFormOpen(false)}>
                    <AppointmentForm
                        services={services}
                        initial={{ startTime }}
                        onSubmit={handleSubmit}
                        onCancel={() => setFormOpen(false)}
                    />
                </Modal>
            </DashboardLayout>
        </RouteGuard>
    );
}
