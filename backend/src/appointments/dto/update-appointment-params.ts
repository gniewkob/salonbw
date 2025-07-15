export interface UpdateAppointmentParams {
    employeeId?: number;
    startTime?: string;
    endTime?: string;
    serviceId?: number;
    notes?: string;
    status?: import('../appointment.entity').AppointmentStatus;
    formulaDescription?: string;
}
