import {
    resolveSyntheticWorkingDays,
    summarizeSyntheticSchedule,
    warsawDateAtMinute,
    warsawDateKey,
    warsawMinuteOfDay,
} from './synthetic-data.schedule';

const anchorDate = new Date('2026-07-29T12:00:00+02:00');

const timetable = {
    id: 1,
    validFrom: '2026-06-01',
    validTo: null,
    slots: [
        {
            dayOfWeek: 0,
            startTime: '09:00',
            endTime: '17:00',
            isBreak: false,
        },
        {
            dayOfWeek: 0,
            startTime: '12:00',
            endTime: '13:00',
            isBreak: true,
        },
        {
            dayOfWeek: 6,
            startTime: '10:00',
            endTime: '15:00',
            isBreak: false,
        },
    ],
};

const input = {
    anchorDate,
    timetables: [timetable],
    exceptions: [
        {
            timetableId: 1,
            date: '2026-07-29',
            type: 'day_off',
            customStartTime: null,
            customEndTime: null,
        },
        {
            timetableId: 1,
            date: '2026-07-30',
            type: 'custom_hours',
            customStartTime: '10:00',
            customEndTime: '14:00',
        },
    ],
};

describe('resolveSyntheticWorkingDays', () => {
    it('resolves working ranges, breaks, exceptions, and scheduled Sundays', () => {
        const days = resolveSyntheticWorkingDays(input);
        const byDate = new Map(days.map((day) => [day.date, day]));

        expect(byDate.get('2026-07-27')?.ranges).toEqual([
            { startMinute: 540, endMinute: 720 },
            { startMinute: 780, endMinute: 1020 },
        ]);
        expect(byDate.get('2026-07-29')?.ranges).toEqual([]);
        expect(byDate.get('2026-07-30')?.ranges).toEqual([
            { startMinute: 600, endMinute: 840 },
        ]);
        expect(byDate.get('2026-08-02')?.ranges).toEqual([
            { startMinute: 600, endMinute: 900 },
        ]);
    });

    it('rejects a day without an applicable timetable', () => {
        expect(() =>
            resolveSyntheticWorkingDays({ ...input, timetables: [] }),
        ).toThrow('SYNTHETIC_SCHEDULE_MISSING');
    });

    it('rejects invalid custom working hours', () => {
        expect(() =>
            resolveSyntheticWorkingDays({
                ...input,
                exceptions: [
                    {
                        ...input.exceptions[1],
                        customEndTime: '10:00',
                    },
                ],
            }),
        ).toThrow('SYNTHETIC_SCHEDULE_CUSTOM_HOURS_INVALID');
    });

    it('rejects multiple exceptions for the selected timetable and day', () => {
        expect(() =>
            resolveSyntheticWorkingDays({
                ...input,
                exceptions: [
                    input.exceptions[0],
                    { ...input.exceptions[0] },
                ],
            }),
        ).toThrow('SYNTHETIC_SCHEDULE_EXCEPTION_AMBIGUOUS');
    });

    it('rejects malformed timetable slots and unknown exception types', () => {
        expect(() =>
            resolveSyntheticWorkingDays({
                ...input,
                timetables: [
                    {
                        ...timetable,
                        slots: [
                            {
                                ...timetable.slots[0],
                                dayOfWeek: 7,
                            },
                        ],
                    },
                ],
            }),
        ).toThrow('SYNTHETIC_SCHEDULE_DAY_OF_WEEK_INVALID');
        expect(() =>
            resolveSyntheticWorkingDays({
                ...input,
                timetables: [
                    {
                        ...timetable,
                        slots: [
                            {
                                ...timetable.slots[0],
                                startTime: '9:00',
                            },
                        ],
                    },
                ],
            }),
        ).toThrow('SYNTHETIC_SCHEDULE_TIME_INVALID');
        expect(() =>
            resolveSyntheticWorkingDays({
                ...input,
                timetables: [
                    {
                        ...timetable,
                        slots: [
                            {
                                ...timetable.slots[0],
                                endTime: '09:00',
                            },
                        ],
                    },
                ],
            }),
        ).toThrow('SYNTHETIC_SCHEDULE_RANGE_INVALID');
        expect(() =>
            resolveSyntheticWorkingDays({
                ...input,
                exceptions: [
                    {
                        ...input.exceptions[0],
                        type: 'unrecognized',
                    },
                ],
            }),
        ).toThrow('SYNTHETIC_SCHEDULE_EXCEPTION_TYPE_INVALID');
    });

    it('summarizes the exact 35/60-day inclusive horizon', () => {
        const days = resolveSyntheticWorkingDays(input);

        expect(summarizeSyntheticSchedule(days)).toEqual({
            rangeStart: '2026-06-24',
            rangeEnd: '2026-09-27',
            workingDays: expect.any(Number),
            closedDays: expect.any(Number),
        });
        expect(new Set(days.map((day) => day.date)).size).toBe(96);
    });

    it('preserves Warsaw calendar dates and wall-clock minutes across DST', () => {
        const date = '2026-03-29';
        const minute = 10 * 60;
        const instant = warsawDateAtMinute(date, minute);

        expect(warsawDateKey(instant)).toBe(date);
        expect(warsawMinuteOfDay(instant)).toBe(minute);
        expect(
            new Set(
                resolveSyntheticWorkingDays({
                    ...input,
                    anchorDate: new Date('2026-03-29T12:00:00+02:00'),
                    timetables: [
                        {
                            ...timetable,
                            validFrom: '2026-01-01',
                        },
                    ],
                }).map((day) => day.date),
            ).size,
        ).toBe(96);
    });
});
