import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServicesService } from './services.service';
import { Service as ServiceEntity } from '../catalog/service.entity';
import { Category } from '../catalog/category.entity';
import { Appointment } from '../appointments/appointment.entity';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';

describe('ServicesService', () => {
    let service: ServicesService;
    const repo = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        delete: jest.fn(),
    } as any;
    const appointments = { count: jest.fn() } as any;
    const categories = { findOne: jest.fn() } as any;
    const logs = { create: jest.fn() } as any;

    beforeEach(async () => {
        repo.create.mockReset();
        repo.save.mockReset();
        repo.findOne.mockReset();
        repo.delete.mockReset();
        appointments.count.mockReset();
        categories.findOne.mockReset();
        logs.create.mockReset();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ServicesService,
                { provide: getRepositoryToken(ServiceEntity), useValue: repo },
                { provide: getRepositoryToken(Appointment), useValue: appointments },
                { provide: getRepositoryToken(Category), useValue: categories },
                { provide: LogsService, useValue: logs },
            ],
        }).compile();
        service = module.get(ServicesService);
    });

    it('creates service and logs', async () => {
        categories.findOne.mockResolvedValue({ id: 1 });
        repo.findOne.mockResolvedValue(undefined);
        repo.create.mockImplementation((d: any) => d);
        repo.save.mockImplementation((d: any) => ({ id: 1, ...d }));

        const dto = { name: 'cut', duration: 30, price: 10, categoryId: 1 };
        const result = await service.create(dto as any);
        expect(result.id).toBe(1);
        expect(logs.create).toHaveBeenCalledWith(
            LogAction.CreateService,
            JSON.stringify({ id: 1, ...dto }),
        );
    });

    it('throws when category missing', async () => {
        categories.findOne.mockResolvedValue(undefined);
        await expect(
            service.create({ name: 'cut', duration: 30, price: 10, categoryId: 1 } as any),
        ).rejects.toBeDefined();
    });

    it('throws on duplicate create', async () => {
        categories.findOne.mockResolvedValue({ id: 1 });
        repo.findOne.mockResolvedValue({ id: 2 });
        await expect(
            service.create({ name: 'cut', duration: 30, price: 10, categoryId: 1 } as any),
        ).rejects.toBeDefined();
    });

    it('updates service and logs', async () => {
        repo.findOne.mockResolvedValueOnce({ id: 1, name: 'old', category: { id: 1 } });
        repo.save.mockImplementation((d: any) => d);
        const res = await service.update(1, { name: 'new' } as any);
        expect(res.name).toBe('new');
        expect(logs.create).toHaveBeenCalledWith(
            LogAction.UpdateService,
            JSON.stringify({ id: 1, name: 'new' }),
        );
    });

    it('throws when updating nonexistent service', async () => {
        repo.findOne.mockResolvedValue(undefined);
        await expect(service.update(1, { name: 'a' } as any)).rejects.toBeDefined();
    });

    it('throws on duplicate update', async () => {
        repo.findOne
            .mockResolvedValueOnce({ id: 1, name: 'a', category: { id: 1 } })
            .mockResolvedValueOnce({ id: 2 });
        await expect(service.update(1, { name: 'b', categoryId: 1 } as any)).rejects.toBeDefined();
    });

    it('deletes service when no appointments', async () => {
        repo.findOne.mockResolvedValue({ id: 1 });
        appointments.count.mockResolvedValue(0);
        repo.delete.mockResolvedValue({ affected: 1 });
        const res = await service.remove(1);
        expect(res).toEqual({ affected: 1 });
        expect(logs.create).toHaveBeenCalledWith(
            LogAction.DeleteService,
            JSON.stringify({ id: 1 }),
        );
    });

    it('throws when deleting with appointments', async () => {
        repo.findOne.mockResolvedValue({ id: 1 });
        appointments.count.mockResolvedValue(1);
        await expect(service.remove(1)).rejects.toBeDefined();
    });

    it('throws when deleting nonexistent service', async () => {
        repo.findOne.mockResolvedValue(undefined);
        await expect(service.remove(1)).rejects.toBeDefined();
    });
});
