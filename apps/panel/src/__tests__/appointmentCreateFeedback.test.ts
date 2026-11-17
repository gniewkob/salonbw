import {
    getMissingCreateBookingFields,
    getCreatedAppointmentId,
} from '@/utils/appointmentCreateFeedback';

describe('V18 appointment creation feedback (without backend policy bypass)', () => {
    it('explains every missing prerequisite instead of a silent disabled button', () => {
        expect(getMissingCreateBookingFields({
            startTime: '',
            employeeId: '',
            serviceId: '',
            clientId: '',
        })).toEqual(['termin', 'pracownika', 'usługę', 'klienta']);
    });

    it('allows a complete booking form to submit to the existing API', () => {
        expect(getMissingCreateBookingFields({
            startTime: '2026-12-07T10:30',
            employeeId: 4,
            serviceId: 12,
            clientId: 23,
        })).toEqual([]);
    });

    it('accepts only a positive safe numeric API creation receipt', () => {
        expect(getCreatedAppointmentId({ id: 145 })).toBe(145);
        for (const candidate of [
            null, undefined, {}, { id: 0 }, { id: -5 },
            { id: '145' }, { id: 1.2 }, { id: Number.MAX_SAFE_INTEGER + 1 },
        ]) {
            expect(getCreatedAppointmentId(candidate)).toBeNull();
        }
    });
});
