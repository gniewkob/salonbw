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
    reschedulePreviousStartTime?: Date | null;
    reschedulePreviousEndTime?: Date | null;
    status: AppointmentStatus;
    serviceId: number;
    serviceName: string;
    employeeName: string;
    /** Comment written by the client while booking. */
    clientComment: string | null;
    /** Staff recommendations saved after finalizing the visit. */
    staffRecommendations: string | null;
    /** Online add-on services selected with the booking. */
    onlineAddonsSummary: string | null;
    /** Total duration after online add-ons were included. */
    onlineTotalDurationMinutes: number | null;
    /** Whether staff still need to verify online add-on duration. */
    onlineDurationNeedsVerification: boolean;
    /** The client's own review of this visit, if any. */
    review: {
        id: number;
        rating: number;
        comment: string | null;
    } | null;
}
