import {
    SALONBW_MODULES,
    resolveSalonBWModule,
} from '@/components/salonbw/navigation';

describe('SalonBW shell profile', () => {
    it('maps shell classes to vendor-compatible values', () => {
        const products = SALONBW_MODULES.find(
            (module) => module.key === 'products',
        );
        const statistics = SALONBW_MODULES.find(
            (module) => module.key === 'statistics',
        );
        const extension = SALONBW_MODULES.find(
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
        expect(resolveSalonBWModule('/products').shell.bodyId).toBe(
            'physical_products',
        );
        expect(resolveSalonBWModule('/statistics').shell.bodyId).toBe(
            'logical_statistics',
        );
        expect(
            resolveSalonBWModule('/admin/gift-cards').shell.mainNavClass,
        ).toBe('extensions');
    });
});
