import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentProductUsageController } from './appointment-product-usage.controller';
import { ProductUsageService } from './product-usage.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { Role } from '../users/role.enum';
import { UsageType } from './usage-type.enum';

describe('AppointmentProductUsageController', () => {
    let controller: AppointmentProductUsageController;
    let usage: { registerUsage: jest.Mock };
    let appointments: { findOne: jest.Mock };

    beforeEach(async () => {
        usage = { registerUsage: jest.fn() } as any;
        appointments = { findOne: jest.fn() } as any;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AppointmentProductUsageController],
            providers: [
                { provide: ProductUsageService, useValue: usage },
                { provide: AppointmentsService, useValue: appointments },
            ],
        }).compile();

        controller = module.get(AppointmentProductUsageController);
    });

    it('registers usage entries with default INTERNAL type', async () => {
        appointments.findOne.mockResolvedValue({
            id: 1,
            employee: { id: 3 },
        });
        usage.registerUsage.mockResolvedValue(['usage']);

        const res = await controller.create(
            1,
            [
                { productId: 1, quantity: 1 },
                { productId: 2, quantity: 2, usageType: UsageType.STOCK_CORRECTION },
            ],
            { user: { id: 3, role: Role.Employee } } as any,
        );

        expect(usage.registerUsage).toHaveBeenCalledWith(1, 3, [
            { productId: 1, quantity: 1, usageType: UsageType.INTERNAL },
            { productId: 2, quantity: 2, usageType: UsageType.STOCK_CORRECTION },
        ]);
        expect(res).toEqual({ usage: ['usage'] });
    });
});
