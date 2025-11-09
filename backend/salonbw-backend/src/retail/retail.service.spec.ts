import { RetailService } from './retail.service';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ProductSale } from './entities/product-sale.entity';
import { Product } from '../products/product.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { Commission } from '../commissions/commission.entity';
import { User } from '../users/user.entity';
import { CommissionsService } from '../commissions/commissions.service';

describe('RetailService.calculateCommissionCents', () => {
    // create a minimal instance (dependencies not used by the tested method)
    const svc = new RetailService(
        null as unknown as Repository<ProductSale>,
        null as unknown as Repository<Product>,
        null as unknown as Repository<InventoryMovement>,
        null as unknown as Repository<Commission>,
        null as unknown as Repository<User>,
        { get: () => 'false' } as unknown as ConfigService,
        null as unknown as CommissionsService,
    );

    test('calculates basic 10% commission and floors cents', () => {
        const cents = svc.calculateCommissionCents(1999, 1, 0, 10);
        // 1999 * 10% = 199.9 cents -> floor to 199
        expect(cents).toBe(199);
    });

    test('small amounts round down to zero', () => {
        const cents = svc.calculateCommissionCents(1, 1, 0, 1);
        // 1 * 1% = 0.01 -> floor to 0
        expect(cents).toBe(0);
    });

    test('applies discount before commission', () => {
        // price 100 cents * 2 = 200, discount 150 => taxable 50, 10% => 5 cents
        const cents = svc.calculateCommissionCents(100, 2, 150, 10);
        expect(cents).toBe(5);
    });
});
