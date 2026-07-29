import {
    assertSyntheticScheduleValid,
    collectSyntheticScheduleViolations,
} from './synthetic-data.validation';
import { SyntheticScheduleValidationInput } from './synthetic-data.types';

const anchorDate = new Date('2026-07-29T12:00:00+02:00');

function validInput(): SyntheticScheduleValidationInput {
    return {
        appointments: [
            {
                key: 'appointment-01',
                employeeId: 7,
                status: 'confirmed',
                startTime: new Date('2026-07-30T09:00:00+02:00'),
                endTime: new Date('2026-07-30T10:00:00+02:00'),
            },
        ],
        workingDays: [
            {
                date: '2026-07-28',
                ranges: [{ startMinute: 9 * 60, endMinute: 17 * 60 }],
            },
            {
                date: '2026-07-30',
                ranges: [
                    { startMinute: 9 * 60, endMinute: 12 * 60 },
                    { startMinute: 13 * 60, endMinute: 17 * 60 },
                ],
            },
        ],
        ownerUserId: 7,
        anchorDate,
    };
}

describe('synthetic schedule validation', () => {
    it('reports an appointment outside working hours', () => {
        const outsideHours = validInput();
        outsideHours.appointments[0].startTime = new Date(
            '2026-07-30T08:30:00+02:00',
        );

        expect(collectSyntheticScheduleViolations(outsideHours)).toContain(
            'appointment-01:SYNTHETIC_APPOINTMENT_OUTSIDE_SCHEDULE',
        );
    });

    it('reports an appointment during a working-day break', () => {
        const duringBreak = validInput();
        duringBreak.appointments[0].startTime = new Date(
            '2026-07-30T12:00:00+02:00',
        );
        duringBreak.appointments[0].endTime = new Date(
            '2026-07-30T13:00:00+02:00',
        );

        expect(collectSyntheticScheduleViolations(duringBreak)).toContain(
            'appointment-01:SYNTHETIC_APPOINTMENT_OUTSIDE_SCHEDULE',
        );
    });

    it('reports the later appointment when owner intervals overlap', () => {
        const overlap = validInput();
        overlap.appointments.push({
            ...overlap.appointments[0],
            key: 'appointment-02',
            startTime: new Date('2026-07-30T09:30:00+02:00'),
            endTime: new Date('2026-07-30T10:30:00+02:00'),
        });

        expect(collectSyntheticScheduleViolations(overlap)).toContain(
            'appointment-02:SYNTHETIC_APPOINTMENT_OVERLAP',
        );
    });

    it('reports an appointment assigned to another employee', () => {
        const wrongEmployee = validInput();
        wrongEmployee.appointments[0].employeeId = 8;

        expect(collectSyntheticScheduleViolations(wrongEmployee)).toContain(
            'appointment-01:SYNTHETIC_APPOINTMENT_EMPLOYEE',
        );
    });

    it('reports a missing working-day entry', () => {
        const missingDay = validInput();
        missingDay.workingDays = missingDay.workingDays.filter(
            (day) => day.date !== '2026-07-30',
        );

        expect(collectSyntheticScheduleViolations(missingDay)).toContain(
            'appointment-01:SYNTHETIC_APPOINTMENT_SCHEDULE_DAY_MISSING',
        );
    });

    it('reports a confirmed appointment before the anchor', () => {
        const pastConfirmed = validInput();
        pastConfirmed.appointments[0].startTime = new Date(
            '2026-07-28T09:00:00+02:00',
        );
        pastConfirmed.appointments[0].endTime = new Date(
            '2026-07-28T10:00:00+02:00',
        );

        expect(collectSyntheticScheduleViolations(pastConfirmed)).toContain(
            'appointment-01:SYNTHETIC_APPOINTMENT_STATUS_TIME',
        );
    });

    it('allows in-progress status when the anchor is in that working-day range but outside the appointment', () => {
        const inProgress = validInput();
        inProgress.anchorDate = new Date('2026-07-29T12:00:00+02:00');
        inProgress.workingDays.unshift({
            date: '2026-07-29',
            ranges: [{ startMinute: 9 * 60, endMinute: 17 * 60 }],
        });
        inProgress.appointments[0] = {
            ...inProgress.appointments[0],
            status: 'in_progress',
            startTime: new Date('2026-07-29T09:00:00+02:00'),
            endTime: new Date('2026-07-29T10:00:00+02:00'),
        };

        expect(collectSyntheticScheduleViolations(inProgress)).toEqual([]);
    });

    it('allows in-progress status when the anchor equals the working-range start', () => {
        const inProgressAtRangeStart = validInput();
        inProgressAtRangeStart.anchorDate = new Date(
            '2026-07-29T09:00:00+02:00',
        );
        inProgressAtRangeStart.workingDays.unshift({
            date: '2026-07-29',
            ranges: [{ startMinute: 9 * 60, endMinute: 17 * 60 }],
        });
        inProgressAtRangeStart.appointments[0] = {
            ...inProgressAtRangeStart.appointments[0],
            status: 'in_progress',
            startTime: new Date('2026-07-29T13:00:00+02:00'),
            endTime: new Date('2026-07-29T14:00:00+02:00'),
        };

        expect(
            collectSyntheticScheduleViolations(inProgressAtRangeStart),
        ).toEqual([]);
    });

    it('allows an appointment ending at a working-range boundary', () => {
        const atRangeBoundary = validInput();
        atRangeBoundary.appointments[0].startTime = new Date(
            '2026-07-30T16:00:00+02:00',
        );
        atRangeBoundary.appointments[0].endTime = new Date(
            '2026-07-30T17:00:00+02:00',
        );

        expect(collectSyntheticScheduleViolations(atRangeBoundary)).toEqual([]);
    });

    it('rejects an appointment ending after a range boundary by seconds', () => {
        const secondsOverrun = validInput();
        secondsOverrun.appointments[0].startTime = new Date(
            '2026-07-30T16:00:00+02:00',
        );
        secondsOverrun.appointments[0].endTime = new Date(
            '2026-07-30T17:00:30+02:00',
        );

        expect(collectSyntheticScheduleViolations(secondsOverrun)).toContain(
            'appointment-01:SYNTHETIC_APPOINTMENT_TIME_INVALID',
        );
    });

    it('accepts a valid appointment schedule', () => {
        expect(() => assertSyntheticScheduleValid(validInput())).not.toThrow();
    });
});
