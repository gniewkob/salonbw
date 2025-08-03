import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { Customer } from './customer.entity';
import { UsersService } from '../users/users.service';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';

describe('CustomersService', () => {
    let service: CustomersService;
    let repo: { find: jest.Mock; findOne: jest.Mock; save: jest.Mock };
    let users: { updateCustomer: jest.Mock; forgetMe: jest.Mock };
    let logs: { create: jest.Mock };

    beforeEach(async () => {
        repo = { find: jest.fn(), findOne: jest.fn(), save: jest.fn() };
        users = { updateCustomer: jest.fn(), forgetMe: jest.fn() };
        logs = { create: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CustomersService,
                { provide: getRepositoryToken(Customer), useValue: repo },
                { provide: UsersService, useValue: users },
                { provide: LogsService, useValue: logs },
            ],
        }).compile();

        service = module.get(CustomersService);
    });

    it('findAll returns customers', async () => {
        repo.find.mockResolvedValue([
            {
                id: 1,
                role: 'client',
                email: 'a@test.com',
                firstName: 'A',
                lastName: 'B',
                privacyConsent: true,
                marketingConsent: false,
                phone: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true,
            },
        ]);
        const result = await service.findAll();
        expect(result).toHaveLength(1);
        expect(result[0].email).toBe('a@test.com');
    });

    it('findOne returns undefined when missing', async () => {
        repo.findOne.mockResolvedValue(undefined);
        await expect(service.findOne(1)).resolves.toBeUndefined();
    });

    it('setActive updates status when customer exists', async () => {
        const cust = { id: 1, role: 'client', isActive: true } as any;
        repo.findOne.mockResolvedValue(cust);
        repo.save.mockResolvedValue({ ...cust, isActive: false });
        const result = await service.setActive(1, false);
        expect(result?.isActive).toBe(false);
    });

    it('setActive returns undefined for missing customer', async () => {
        repo.findOne.mockResolvedValue(undefined);
        await expect(service.setActive(2, true)).resolves.toBeUndefined();
    });

    it('updateMarketingConsent updates and logs change', async () => {
        const cust = { id: 1, role: 'client', marketingConsent: false } as any;
        repo.findOne.mockResolvedValue(cust);
        repo.save.mockResolvedValue({ ...cust, marketingConsent: true });
        const result = await service.updateMarketingConsent(1, true);
        expect(result?.marketingConsent).toBe(true);
        expect(logs.create).toHaveBeenCalledWith(
            LogAction.MarketingConsentChange,
            JSON.stringify({ id: 1, marketingConsent: true }),
            1,
        );
    });

    it('updateMarketingConsent returns undefined when customer missing', async () => {
        repo.findOne.mockResolvedValue(undefined);
        await expect(
            service.updateMarketingConsent(3, true),
        ).resolves.toBeUndefined();
    });

    it('updateProfile delegates to users service', async () => {
        const existing = { id: 1, role: 'client' } as any;
        repo.findOne
            .mockResolvedValueOnce(existing)
            .mockResolvedValueOnce({ ...existing, firstName: 'New' });
        const dto = { firstName: 'New' };
        const result = await service.updateProfile(1, dto);
        expect(users.updateCustomer).toHaveBeenCalledWith(1, dto);
        expect(result.firstName).toBe('New');
    });

    it('forgetMe calls users service', async () => {
        await service.forgetMe(5);
        expect(users.forgetMe).toHaveBeenCalledWith(5);
    });
});

