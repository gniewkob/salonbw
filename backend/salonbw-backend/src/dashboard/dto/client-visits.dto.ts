import { AppointmentStatus } from '../../appointments/appointment.entity';

/**
 * Client-safe projection of a visit for the "Moje wizyty" history view.
 * Deliberately excludes money fields (paidAmount/tipAmount/discount/
 * extraServices) and the staff-private internalNote — clients must never
 * see amounts or internal notes.
 */
export class ClientVisitDto {
    id: number;
    startTime: Date;
    endTime: Date;
    status: AppointmentStatus;
    serviceId: number;
    serviceName: string;
    employeeName: string;
    /** Client-visible visit note / salon recommendations. */
    notes: string | null;
    /** The client's own review of this visit, if any. */
    review: {
        id: number;
        rating: number;
        comment: string | null;
    } | null;
}
