import { generateSyntheticDataset } from './synthetic-data.dataset';

const input = {
    anchorDate: new Date('2026-07-28T12:00:00+02:00'),
    ownerUserId: 7,
    serviceIds: [10, 11, 12],
};

describe('generateSyntheticDataset', () => {
    it('is deterministic for the same local day', () => {
        expect(generateSyntheticDataset(input)).toEqual(
            generateSyntheticDataset(input),
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
