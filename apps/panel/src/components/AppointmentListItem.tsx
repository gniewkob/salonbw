import { Appointment } from '@/types';

interface Props {
    appointment: Appointment;
}

export default function AppointmentListItem({ appointment }: Props) {
    return (
        <li className="border p-2">
            <div>{new Date(appointment.startTime).toLocaleString()}</div>
            <div className="small text-muted">{appointment.client?.name}</div>
            <div className="small text-muted">{appointment.service?.name}</div>
            <div className="small text-muted">
                {appointment.employee?.name || appointment.employee?.fullName}
            </div>
        </li>
    );
}
