import {
    SALON_MODULES,
    resolveSalonModule,
} from '@/components/salon/navigation';

describe('SalonBW shell profile', () => {
    it('maps shell classes to vendor-compatible values', () => {
        const products = SALON_MODULES.find(
            (module) => module.key === 'products',
        );
        const statistics = SALON_MODULES.find(
            (module) => module.key === 'statistics',
        );
        const extension = SALON_MODULES.find(
            (module) => module.key === 'extension',
        );

        expect(products?.shell.bodyId).toBe('physical_products');
        expect(products?.shell.mainNavClass).toBe('stock');
        expect(products?.shell.mainContentClass).toBe('stock');

        expect(statistics?.shell.bodyId).toBe('logical_statistics');
        expect(statistics?.shell.secondaryNavVariant).toBe('tree');
        expect(statistics?.shell.secondaryNavRootClass).toBe('column_row tree');

        expect(extension?.shell.mainNavClass).toBe('extensions');
    });

    it('resolves physical and logical panel modules to shared shell profiles', () => {
        expect(resolveSalonModule('/products').shell.bodyId).toBe(
            'physical_products',
        );
        expect(resolveSalonModule('/statistics').shell.bodyId).toBe(
            'logical_statistics',
        );
        expect(resolveSalonModule('/admin/gift-cards').shell.mainNavClass).toBe(
            'extensions',
        );
    });
});
