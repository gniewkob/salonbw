import { Appointment } from '@/types';

interface Props {
    appointment: Appointment;
}

export default function AppointmentListItem({ appointment }: Props) {
    return (
        <li className="border p-2">
            <div>{new Date(appointment.startTime).toLocaleString()}</div>
            <div className="text-sm text-gray-500">
                {appointment.client?.name}
            </div>
            <div className="text-sm text-gray-500">
                {appointment.service?.name}
            </div>
            <div className="text-sm text-gray-500">
                {appointment.employee?.name || appointment.employee?.fullName}
            </div>
        </li>
    );
}
