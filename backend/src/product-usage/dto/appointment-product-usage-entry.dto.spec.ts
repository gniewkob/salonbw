import { validate } from 'class-validator';
import { AppointmentProductUsageEntryDto } from './appointment-product-usage-entry.dto';
import { UsageType } from '../usage-type.enum';

describe('AppointmentProductUsageEntryDto', () => {
    it('rejects SALE usageType', async () => {
        const dto = new AppointmentProductUsageEntryDto();
        dto.productId = 1;
        dto.quantity = 1;
        dto.usageType = UsageType.SALE as any;
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('accepts INTERNAL usageType', async () => {
        const dto = new AppointmentProductUsageEntryDto();
        dto.productId = 1;
        dto.quantity = 1;
        dto.usageType = UsageType.INTERNAL;
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('accepts STOCK_CORRECTION usageType', async () => {
        const dto = new AppointmentProductUsageEntryDto();
        dto.productId = 1;
        dto.quantity = 1;
        dto.usageType = UsageType.STOCK_CORRECTION;
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });
});
