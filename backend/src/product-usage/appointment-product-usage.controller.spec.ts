import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentProductUsageController } from './appointment-product-usage.controller';
import { ProductUsageService } from './product-usage.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { SalesService } from '../sales/sales.service';
import { Role } from '../users/role.enum';
import { UsageType } from './usage-type.enum';
import { BadRequestException } from '@nestjs/common';

describe('AppointmentProductUsageController', () => {
    let controller: AppointmentProductUsageController;
    let usage: { registerUsage: jest.Mock };
    let appointments: { findOne: jest.Mock };
    let sales: { create: jest.Mock };

    beforeEach(async () => {
        usage = { registerUsage: jest.fn() } as any;
        appointments = { findOne: jest.fn() } as any;
        sales = { create: jest.fn() } as any;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AppointmentProductUsageController],
            providers: [
                { provide: ProductUsageService, useValue: usage },
                { provide: AppointmentsService, useValue: appointments },
                { provide: SalesService, useValue: sales },
            ],
        }).compile();

        controller = module.get(AppointmentProductUsageController);
    });

    it('splits sale and usage entries', async () => {
        appointments.findOne.mockResolvedValue({
            id: 1,
            client: { id: 2 },
            employee: { id: 3 },
        });
        usage.registerUsage.mockResolvedValue(['usage']);
        sales.create.mockResolvedValue('sale');

        const res = await controller.create(
            '1',
            [
                { productId: 1, quantity: 1 },
                { productId: 2, quantity: 2, usageType: UsageType.SALE },
            ],
            { user: { id: 3, role: Role.Employee } } as any,
        );

        expect(sales.create).toHaveBeenCalledWith(2, 3, 2, 2);
        expect(usage.registerUsage).toHaveBeenCalledWith(1, 3, [
            { productId: 1, quantity: 1, usageType: UsageType.INTERNAL },
        ]);
        expect(res).toEqual({ sales: ['sale'], usage: ['usage'] });
    });

    it('rejects sale entries without client', async () => {
        appointments.findOne.mockResolvedValue({
            id: 1,
            client: null,
            employee: { id: 3 },
        });
        await expect(
            controller.create(
                '1',
                [{ productId: 1, quantity: 1, usageType: UsageType.SALE }],
                { user: { id: 3, role: Role.Employee } } as any,
            ),
        ).rejects.toBeInstanceOf(BadRequestException);
    });
});

