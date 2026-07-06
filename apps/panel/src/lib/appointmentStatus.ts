export type AppointmentStatusTone =
    | 'attention'
    | 'danger'
    | 'info'
    | 'neutral'
    | 'success';

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
    scheduled: 'Zaplanowana',
    confirmed: 'Potwierdzona',
    in_progress: 'W trakcie',
    completed: 'Zrealizowana',
    cancelled: 'Anulowana',
    no_show: 'Nieobecność',
    online_pending: 'Oczekuje',
    rescheduled_pending: 'Zmiana terminu',
};

const APPOINTMENT_STATUS_TONES: Record<string, AppointmentStatusTone> = {
    scheduled: 'neutral',
    confirmed: 'info',
    in_progress: 'attention',
    completed: 'success',
    cancelled: 'danger',
    no_show: 'danger',
    online_pending: 'attention',
    rescheduled_pending: 'info',
};

export function appointmentStatusLabel(status: string) {
    return APPOINTMENT_STATUS_LABELS[status] ?? status;
}

export function appointmentStatusTone(status: string): AppointmentStatusTone {
    return APPOINTMENT_STATUS_TONES[status] ?? 'neutral';
}
