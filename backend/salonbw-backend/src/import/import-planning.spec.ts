import {
    buildVariantSyncPlan,
    hasImportChanges,
    resolveStockUnits,
} from './import-planning';

describe('import planning', () => {
    it('updates a matching variant without changing its id', () => {
        const plan = buildVariantSyncPlan(
            [{ id: 17, name: 'Długie', isActive: true }],
            [{ name: ' długie ', duration: 90 }],
        );

        expect(plan.conflicts).toEqual([]);
        expect(plan.upserts).toEqual([
            expect.objectContaining({ action: 'update', existingId: 17 }),
        ]);
        expect(plan.deactivateIds).toEqual([]);
    });

    it('deactivates a missing variant instead of deleting it', () => {
        const plan = buildVariantSyncPlan(
            [
                { id: 17, name: 'Długie', isActive: true },
                { id: 18, name: 'Krótkie', isActive: true },
            ],
            [{ name: 'Długie', duration: 90 }],
        );

        expect(plan.deactivateIds).toEqual([18]);
    });

    it('reports ambiguous duplicate variant names before writing', () => {
        const plan = buildVariantSyncPlan(
            [{ id: 17, name: 'Długie', isActive: true }],
            [
                { name: 'Długie', duration: 90 },
                { name: ' długie ', duration: 100 },
            ],
        );

        expect(plan.conflicts).toEqual([
            'Duplicate incoming variant identity: długie',
        ]);
    });

    it('requires stock in usage units when only packages are supplied', () => {
        expect(resolveStockUnits(null, 1)).toEqual({
            value: null,
            conflict: 'Package stock requires an explicit usage-unit value.',
        });
        expect(resolveStockUnits(60, 1)).toEqual({ value: 60 });
    });

    it('rejects fractional stock because the database column is integer', () => {
        expect(resolveStockUnits(1.5, null)).toEqual({
            value: null,
            conflict: 'Usage-unit stock must be a whole number.',
        });
        expect(resolveStockUnits(-1, null)).toEqual({
            value: null,
            conflict: 'Usage-unit stock cannot be negative.',
        });
    });

    it('distinguishes a real update from an unchanged imported row', () => {
        const current = { name: 'Kolor', price: 100, description: null };

        expect(
            hasImportChanges(current, {
                name: 'Kolor',
                price: 100,
                description: undefined,
            }),
        ).toBe(false);
        expect(hasImportChanges(current, { price: 120 })).toBe(true);
    });
});
