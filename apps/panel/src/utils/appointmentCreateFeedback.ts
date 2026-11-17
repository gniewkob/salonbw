/**
 * Presentation-only validation. Existing API and appointment-drawer conflict
 * checks remain authoritative; these hints never authorize a booking.
 */
export interface CreateBookingFields {
    startTime: string;
    employeeId: number | '';
    serviceId: number | '';
    clientId: number | '';
}

export function getMissingCreateBookingFields(
    fields: CreateBookingFields,
): string[] {
    const missing: string[] = [];
    if (fields.startTime.length === 0) missing.push('termin');
    if (Number(fields.employeeId) <= 0) missing.push('pracownika');
    if (Number(fields.serviceId) <= 0) missing.push('usługę');
    if (Number(fields.clientId) <= 0) missing.push('klienta');
    return missing;
}

/**
 * POST /appointments returns {id:number}. Without that receipt, do not
 * display a success message or automatically repeat a possibly committed POST.
 */
export function getCreatedAppointmentId(response: unknown): number | null {
    if (!response || typeof response !== 'object' || !('id' in response)) {
        return null;
    }
    const id = response.id;
    return typeof id === 'number' && Number.isSafeInteger(id) && id > 0
        ? id
        : null;
}
