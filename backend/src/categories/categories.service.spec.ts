import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesService } from './categories.service';
import { Category } from '../catalog/category.entity';
import { Service } from '../catalog/service.entity';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';

describe('CategoriesService', () => {
    let service: CategoriesService;
    const repo = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
    } as any;
    const svcRepo = { count: jest.fn() } as any;
    const logs = { create: jest.fn() } as any;

    beforeEach(async () => {
        repo.create.mockReset();
        repo.save.mockReset();
        repo.findOne.mockReset();
        repo.find.mockReset();
        repo.delete.mockReset();
        repo.count.mockReset();
        svcRepo.count.mockReset();
        logs.create.mockReset();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoriesService,
                { provide: getRepositoryToken(Category), useValue: repo },
                { provide: getRepositoryToken(Service), useValue: svcRepo },
                { provide: LogsService, useValue: logs },
            ],
        }).compile();
        service = module.get(CategoriesService);
    });

    it('creates category', async () => {
        repo.findOne.mockResolvedValue(undefined);
        repo.create.mockImplementation((d: any) => d);
        repo.save.mockImplementation((d: any) => ({ id: 1, ...d }));
        const result = await service.create({ name: 'n' });
        expect(result.id).toBe(1);
        expect(logs.create).toHaveBeenCalledWith(
            LogAction.CreateCategory,
            JSON.stringify({ id: 1, name: 'n' }),
        );
    });

    it('throws on duplicate name', async () => {
        repo.findOne.mockResolvedValue({ id: 2 });
        await expect(service.create({ name: 'n' })).rejects.toBeDefined();
    });

    it('updates category', async () => {
        repo.findOne.mockResolvedValueOnce({ id: 1, name: 'a' });
        repo.save.mockImplementation((d: any) => d);
        const res = await service.update(1, { name: 'b' });
        expect(res!.name).toBe('b');
        expect(logs.create).toHaveBeenCalledWith(
            LogAction.UpdateCategory,
            JSON.stringify({ id: 1, name: 'b' }),
        );
    });

    it('delete conflicts when services exist', async () => {
        repo.findOne.mockResolvedValue({ id: 1 });
        svcRepo.count.mockResolvedValue(1);
        await expect(service.remove(1)).rejects.toBeDefined();
    });
});
