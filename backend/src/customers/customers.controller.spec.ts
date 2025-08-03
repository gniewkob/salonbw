import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { UpdateCustomerDto } from '../users/dto/update-customer.dto';

describe('CustomersController', () => {
    let controller: CustomersController;
    let service: {
        findAll: jest.Mock;
        findOne: jest.Mock;
        updateProfile: jest.Mock;
        setActive: jest.Mock;
        updateMarketingConsent: jest.Mock;
        forgetMe: jest.Mock;
    };

    beforeEach(async () => {
        service = {
            findAll: jest.fn(),
            findOne: jest.fn(),
            updateProfile: jest.fn(),
            setActive: jest.fn(),
            updateMarketingConsent: jest.fn(),
            forgetMe: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [CustomersController],
            providers: [{ provide: CustomersService, useValue: service }],
        }).compile();

        controller = module.get(CustomersController);
    });

    it('list delegates to service', async () => {
        service.findAll.mockResolvedValue(['c']);
        await expect(controller.list()).resolves.toEqual(['c']);
    });

    it('getMe returns customer or throws', async () => {
        service.findOne.mockResolvedValueOnce({ id: 1 });
        await expect(controller.getMe({ user: { id: 1 } })).resolves.toEqual({
            id: 1,
        });
        service.findOne.mockResolvedValueOnce(undefined);
        await expect(
            controller.getMe({ user: { id: 1 } }),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updateMe calls service', async () => {
        service.updateProfile.mockResolvedValue({ id: 1 });
        const dto = { firstName: 'New' } as UpdateCustomerDto;
        await expect(
            controller.updateMe({ user: { id: 1 } }, dto),
        ).resolves.toEqual({ id: 1 });
        expect(service.updateProfile).toHaveBeenCalledWith(1, dto);
    });

    it('get by id returns customer or throws', async () => {
        service.findOne.mockResolvedValueOnce({ id: 2 });
        await expect(controller.get(2)).resolves.toEqual({ id: 2 });
        service.findOne.mockResolvedValueOnce(undefined);
        await expect(controller.get(2)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('activate and deactivate delegate to service', async () => {
        service.setActive.mockResolvedValueOnce({ id: 3, isActive: true });
        await expect(controller.activate(3)).resolves.toEqual({
            id: 3,
            isActive: true,
        });
        service.setActive.mockResolvedValueOnce(undefined);
        await expect(controller.activate(4)).rejects.toBeInstanceOf(
            NotFoundException,
        );
        service.setActive.mockResolvedValueOnce({ id: 3, isActive: false });
        await expect(controller.deactivate(3)).resolves.toEqual({
            id: 3,
            isActive: false,
        });
    });

    it('updateMarketingConsent delegates to service', async () => {
        service.updateMarketingConsent.mockResolvedValueOnce({
            id: 5,
            marketingConsent: true,
        });
        await expect(
            controller.updateMarketingConsent(5, { marketingConsent: true }),
        ).resolves.toEqual({ id: 5, marketingConsent: true });
        service.updateMarketingConsent.mockResolvedValueOnce(undefined);
        await expect(
            controller.updateMarketingConsent(5, { marketingConsent: false }),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('removeMe calls service', async () => {
        await expect(controller.removeMe({ user: { id: 6 } })).resolves.toEqual({
            success: true,
        });
        expect(service.forgetMe).toHaveBeenCalledWith(6);
    });
});

