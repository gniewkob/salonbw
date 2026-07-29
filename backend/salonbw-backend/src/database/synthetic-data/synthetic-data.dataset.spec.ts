import { generateSyntheticDataset } from './synthetic-data.dataset';
import {
    SYNTHETIC_FUTURE_DAYS,
    SYNTHETIC_PAST_DAYS,
    warsawDateKey,
    warsawMinuteOfDay,
} from './synthetic-data.schedule';
import type {
    DatasetInput,
    SyntheticWorkingDay,
    SyntheticWorkingRange,
} from './synthetic-data.types';

function dateKeyAtOffset(date: string, offset: number): string {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day + offset))
        .toISOString()
        .slice(0, 10);
}

function horizonWorkingDays(
    anchorDate: Date,
    ranges: SyntheticWorkingRange[] = [
        { startMinute: 9 * 60, endMinute: 17 * 60 },
    ],
): SyntheticWorkingDay[] {
    const anchorDateKey = warsawDateKey(anchorDate);
    return Array.from(
        { length: SYNTHETIC_PAST_DAYS + SYNTHETIC_FUTURE_DAYS + 1 },
        (_, index) => ({
            date: dateKeyAtOffset(
                anchorDateKey,
                index - SYNTHETIC_PAST_DAYS,
            ),
            ranges: ranges.map((range) => ({ ...range })),
        }),
    );
}

function cloneInput(source: DatasetInput): DatasetInput {
    return {
        ...source,
        anchorDate: new Date(source.anchorDate),
        serviceIds: [...source.serviceIds],
        workingDays: source.workingDays.map((day) => ({
            date: day.date,
            ranges: day.ranges.map((range) => ({ ...range })),
        })),
    };
}

const anchorDate = new Date('2026-07-28T12:00:00+02:00');
const input: DatasetInput = {
    anchorDate,
    ownerUserId: 7,
    serviceIds: [10, 11, 12],
    workingDays: horizonWorkingDays(anchorDate),
};
const closedWednesdayAnchor = new Date('2026-07-29T12:00:00+02:00');
const closedWednesdayInput: DatasetInput = {
    ...input,
    anchorDate: closedWednesdayAnchor,
    workingDays: horizonWorkingDays(closedWednesdayAnchor).map((day) =>
        day.date === '2026-07-29' ? { ...day, ranges: [] } : day,
    ),
};

describe('generateSyntheticDataset', () => {
    it('is deterministic for cloned schedule inputs', () => {
        expect(generateSyntheticDataset(cloneInput(input))).toEqual(
            generateSyntheticDataset(cloneInput(input)),
        );
    });

    it('creates the agreed representative dataset size', () => {
        const data = generateSyntheticDataset(input);

        expect(data.clients).toHaveLength(12);
        expect(data.appointments).toHaveLength(30);
        expect(data.productCategories).toHaveLength(4);
        expect(data.products).toHaveLength(12);
        expect(data.suppliers).toHaveLength(2);
        expect(data.deliveries).toHaveLength(1);
        expect(data.orders).toHaveLength(1);
        expect(data.sales).toHaveLength(1);
        expect(data.usages).toHaveLength(1);
        expect(data.stocktakings).toHaveLength(1);
    });

    it('uses only non-routable synthetic identity markers', () => {
        const data = generateSyntheticDataset(input);

        expect(
            data.clients.every(
                (client) =>
                    client.name.startsWith('SYNTHETIC') &&
                    client.email.endsWith('@example.invalid') &&
                    client.phone === null &&
                    client.receiveNotifications === false,
            ),
        ).toBe(true);
        expect(data.products.every((p) => p.sku.startsWith('SYNTH-'))).toBe(
            true,
        );
        expect(JSON.stringify(data)).not.toContain('@salon-bw.pl');
    });

    it('keeps synthetic identifiers unique', () => {
        const data = generateSyntheticDataset(input);

        expect(new Set(data.clients.map((c) => c.email)).size).toBe(12);
        expect(new Set(data.products.map((p) => p.sku)).size).toBe(12);
    });

    it('covers every appointment state and produces ordered times', () => {
        const data = generateSyntheticDataset(input);

        expect(new Set(data.appointments.map((a) => a.status))).toEqual(
            new Set([
                'scheduled',
                'confirmed',
                'in_progress',
                'cancelled',
                'completed',
                'no_show',
                'online_pending',
                'rescheduled_pending',
            ]),
        );
        expect(
            data.appointments.every(
                (appointment) =>
                    appointment.startTime.getTime() <
                    appointment.endTime.getTime(),
            ),
        ).toBe(true);
    });

    it('moves every in-progress visit off a closed anchor day', () => {
        const data = generateSyntheticDataset(closedWednesdayInput);
        expect(
            data.appointments.some(
                (visit) => warsawDateKey(visit.startTime) === '2026-07-29',
            ),
        ).toBe(false);
        expect(
            data.appointments.filter(
                (visit) => visit.status === 'in_progress',
            ),
        ).toHaveLength(0);
        expect(data.generationSummary.convertedInProgress).toBe(4);
    });

    it('preserves an in-progress visit when the anchor is inside working hours', () => {
        const data = generateSyntheticDataset(input);

        expect(
            data.appointments.filter(
                (visit) => visit.status === 'in_progress',
            ).length,
        ).toBeGreaterThan(0);
    });

    it('does not place any visit across a schedule break', () => {
        const breakInput: DatasetInput = {
            ...input,
            workingDays: horizonWorkingDays(input.anchorDate, [
                { startMinute: 9 * 60, endMinute: 12 * 60 },
                { startMinute: 13 * 60, endMinute: 17 * 60 },
            ]),
        };
        const data = generateSyntheticDataset(breakInput);

        expect(
            data.appointments.every((visit) => {
                const start = warsawMinuteOfDay(visit.startTime);
                const end = warsawMinuteOfDay(visit.endTime);
                return start >= 13 * 60 || end <= 12 * 60;
            }),
        ).toBe(true);
    });

    it('uses an explicitly scheduled Sunday when future weekdays are closed', () => {
        const sundayInput: DatasetInput = {
            ...input,
            workingDays: horizonWorkingDays(input.anchorDate, []).map((day) => {
                const beforeAnchor = day.date < warsawDateKey(input.anchorDate);
                const sunday =
                    new Date(`${day.date}T12:00:00.000Z`).getUTCDay() === 0;
                return beforeAnchor || sunday
                    ? {
                          ...day,
                          ranges: [
                              {
                                  startMinute: 9 * 60,
                                  endMinute: 17 * 60,
                              },
                          ],
                      }
                    : day;
            }),
        };
        const data = generateSyntheticDataset(sundayInput);

        expect(
            data.appointments.some(
                (visit) => warsawDateKey(visit.startTime) === '2026-08-02',
            ),
        ).toBe(true);
    });

    it('rejects a schedule without capacity', () => {
        const closedInput: DatasetInput = {
            ...input,
            workingDays: horizonWorkingDays(input.anchorDate, []),
        };

        expect(() => generateSyntheticDataset(closedInput)).toThrow(
            'SYNTHETIC_SCHEDULE_CAPACITY',
        );
    });

    it('does not overlap owner appointment intervals', () => {
        const intervals = generateSyntheticDataset(input).appointments
            .map((appointment) => ({
                startTime: appointment.startTime.getTime(),
                endTime: appointment.endTime.getTime(),
            }))
            .sort((a, b) => a.startTime - b.startTime);

        expect(
            intervals.every(
                (current, index) =>
                    index === intervals.length - 1 ||
                    current.endTime <= intervals[index + 1].startTime,
            ),
        ).toBe(true);
    });

    it('covers normal, low and zero product stock', () => {
        const data = generateSyntheticDataset(input);

        expect(data.products.some((p) => p.stock === 0)).toBe(true);
        expect(
            data.products.some(
                (p) => p.stock > 0 && p.stock < p.minQuantity,
            ),
        ).toBe(true);
        expect(data.products.some((p) => p.stock >= p.minQuantity)).toBe(true);
    });

    it('provides representative reporting and service-recipe records', () => {
        const data = generateSyntheticDataset(input);
        const completedCount = data.appointments.filter(
            (appointment) => appointment.status === 'completed',
        ).length;

        expect(data.commissions).toHaveLength(completedCount);
        expect(data.reviews.length).toBeGreaterThan(0);
        expect(data.loyaltyTransactions.length).toBeGreaterThan(0);
        expect(data.recipeItems).toEqual([
            {
                serviceId: 10,
                productKey: 'product-1',
                quantity: 1,
                unit: 'szt.',
            },
        ]);
    });

    it('rejects missing owner and service context', () => {
        expect(() =>
            generateSyntheticDataset({ ...input, ownerUserId: 0 }),
        ).toThrow('ownerUserId');
        expect(() =>
            generateSyntheticDataset({ ...input, serviceIds: [] }),
        ).toThrow('serviceIds');
    });
});
