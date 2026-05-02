import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { SalesController } from './sales.controller';
import { RetailService } from './retail.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ReverseSaleDto } from './dto/reverse-sale.dto';

describe('SalesController', () => {
    let controller: SalesController;
    let service: jest.Mocked<RetailService>;

    beforeEach(() => {
        service = {
            createSale: jest.fn().mockResolvedValue({ id: 1 }),
            listSales: jest.fn().mockResolvedValue([{ id: 2 }]),
            getSalesSummary: jest.fn().mockResolvedValue({ units: 3 }),
            getSaleDetails: jest.fn().mockResolvedValue({ id: 4 }),
            voidSale: jest.fn().mockResolvedValue({ id: 5, kind: 'void' }),
            refundSale: jest
                .fn()
                .mockResolvedValue({ id: 6, kind: 'refund' }),
            correctSale: jest
                .fn()
                .mockResolvedValue({ id: 7, kind: 'correction' }),
        } as unknown as jest.Mocked<RetailService>;

        controller = new SalesController(service);
    });

    it('delegates createSale to service with current user id', async () => {
        const dto = {
            items: [{ productId: 10, quantity: 2 }],
        } as CreateSaleDto;

        await expect(controller.createSale(dto, { userId: 91 })).resolves.toEqual(
            { id: 1 },
        );
        expect(service.createSale).toHaveBeenCalledWith(dto, { id: 91 });
    });

    it('delegates findSales to service', async () => {
        await expect(controller.findSales()).resolves.toEqual([{ id: 2 }]);
        expect(service.listSales).toHaveBeenCalled();
    });

    it('parses customerId and appointmentIds in findSales filters', async () => {
        await controller.findSales(
            '2',
            '25',
            'S2026',
            'sale',
            undefined,
            '10, 20, abc, 0',
            '123',
        );

        expect(service.listSales).toHaveBeenCalledWith({
            page: 2,
            pageSize: 25,
            search: 'S2026',
            kind: 'sale',
            appointmentId: undefined,
            appointmentIds: [10, 20],
            customerId: 123,
        });
    });

    it('delegates getSummary to service with parsed dates', async () => {
        await expect(
            controller.getSummary('2026-03-01', '2026-03-31'),
        ).resolves.toEqual({ units: 3 });
        expect(service.getSalesSummary).toHaveBeenCalledWith({
            from: new Date('2026-03-01'),
            to: new Date('2026-03-31'),
        });
    });

    it('delegates findSale to service', async () => {
        await expect(controller.findSale(4)).resolves.toEqual({ id: 4 });
        expect(service.getSaleDetails).toHaveBeenCalledWith(4);
    });

    it('delegates voidSale to service with current user id', async () => {
        const dto = {
            reason: 'void test',
            restock: true,
        } as ReverseSaleDto;

        await expect(
            controller.voidSale(5, dto, { userId: 92 }),
        ).resolves.toEqual({ id: 5, kind: 'void' });
        expect(service.voidSale).toHaveBeenCalledWith(5, dto, { id: 92 });
    });

    it('delegates refundSale to service with current user id', async () => {
        const dto = {
            reason: 'refund test',
            items: [{ saleItemId: 15, quantity: 1 }],
        } as ReverseSaleDto;

        await expect(
            controller.refundSale(6, dto, { userId: 93 }),
        ).resolves.toEqual({ id: 6, kind: 'refund' });
        expect(service.refundSale).toHaveBeenCalledWith(6, dto, { id: 93 });
    });

    it('delegates correctSale to service with current user id', async () => {
        const dto = {
            reason: 'correction test',
            items: [{ saleItemId: 16, quantity: 1 }],
        } as ReverseSaleDto;

        await expect(
            controller.correctSale(7, dto, { userId: 94 }),
        ).resolves.toEqual({ id: 7, kind: 'correction' });
        expect(service.correctSale).toHaveBeenCalledWith(7, dto, { id: 94 });
    });

    it('maps voidSale to POST /:id/void', () => {
        const descriptor = Object.getOwnPropertyDescriptor(
            SalesController.prototype,
            'voidSale',
        );
        expect(typeof descriptor?.value).toBe('function');

        const handler = descriptor!.value as (
            this: SalesController,
            ...args: unknown[]
        ) => unknown;

        expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(':id/void');
        expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
            RequestMethod.POST,
        );
    });

    it('maps refundSale to POST /:id/refund', () => {
        const descriptor = Object.getOwnPropertyDescriptor(
            SalesController.prototype,
            'refundSale',
        );
        expect(typeof descriptor?.value).toBe('function');

        const handler = descriptor!.value as (
            this: SalesController,
            ...args: unknown[]
        ) => unknown;

        expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(':id/refund');
        expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
            RequestMethod.POST,
        );
    });

    it('maps correctSale to POST /:id/correction', () => {
        const descriptor = Object.getOwnPropertyDescriptor(
            SalesController.prototype,
            'correctSale',
        );
        expect(typeof descriptor?.value).toBe('function');

        const handler = descriptor!.value as (
            this: SalesController,
            ...args: unknown[]
        ) => unknown;

        expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(
            ':id/correction',
        );
        expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
            RequestMethod.POST,
        );
    });
});
