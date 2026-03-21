import type { ProductType } from '@/types';

export function getProductTypeLabel(type?: ProductType | null): string {
    switch (type) {
        case 'supply':
            return 'materiał';
        case 'universal':
            return 'towar i materiał';
        case 'product':
        default:
            return 'towar';
    }
}
