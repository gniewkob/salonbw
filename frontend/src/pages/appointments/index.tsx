import RouteGuard from '@/components/RouteGuard';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import AppointmentForm from '@/components/AppointmentForm';
import { useAppointments } from '@/hooks/useAppointments';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { useAppointmentsApi } from '@/api/appointments';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg, EventDropArg } from '@fullcalendar/interaction';
import { useState } from 'react';

export default function AppointmentsPage() {
  const { data: appointments, loading, error } = useAppointments();
  const { data: clients } = useClients();
  const { data: services } = useServices();
  const api = useAppointmentsApi();
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState('');

  if (loading || !clients || !services) return <div>Loading...</div>;
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

  const handleEventClick = (info: any) => {
    setEditId(Number(info.event.id));
    setStartTime(info.event.startStr);
    setFormOpen(true);
  };

  const handleDrop = async (arg: EventDropArg) => {
    try {
      await api.update(Number(arg.event.id), { startTime: arg.event.start!.toISOString() });
    } catch (err) {
      alert('Conflict');
      arg.revert();
    }
  };

  const handleSubmit = async (data: { clientId: number; serviceId: number; startTime: string }) => {
    if (editId) {
      await api.update(editId, { startTime: data.startTime });
    } else {
      await api.create({ ...data, employeeId: 1 });
    }
    setFormOpen(false);
  };

  return (
    <RouteGuard>
      <Layout>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleDrop}
          editable
        />
        <Modal open={formOpen} onClose={() => setFormOpen(false)}>
          <AppointmentForm
            clients={clients}
            services={services}
            initial={{ startTime }}
            onSubmit={handleSubmit}
            onCancel={() => setFormOpen(false)}
          />
        </Modal>
      </Layout>
    </RouteGuard>
  );
}
