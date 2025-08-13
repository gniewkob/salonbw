import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';
import { ServicesService } from './services.service';
import { UpdateServiceDto } from './dto/update-service.dto';

describe('ServicesService', () => {
    let service: ServicesService;
    let repo: jest.Mocked<Repository<Service>>;
    let serviceEntity: Service;

    const mockRepository = () => ({
        create: jest
            .fn()
            .mockImplementation((dto: Partial<Service>) => dto as Service),
        save: jest
            .fn()
            .mockImplementation((entity: Service) =>
                Promise.resolve({ ...serviceEntity, ...entity }),
            ),
        find: jest.fn().mockResolvedValue([serviceEntity]),
        findOne: jest.fn().mockResolvedValue(serviceEntity),
        update: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
    });

    beforeEach(async () => {
        serviceEntity = {
            id: 1,
            name: 'Cut',
            description: 'Hair cut',
            duration: 30,
            price: 10,
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ServicesService,
                {
                    provide: getRepositoryToken(Service),
                    useValue: mockRepository(),
                },
            ],
        }).compile();

        service = module.get<ServicesService>(ServicesService);
        repo = module.get(getRepositoryToken(Service));
    });

    it('creates a service', async () => {
        const dto = {
            name: 'Cut',
            description: 'Hair cut',
            duration: 30,
            price: 10,
        };
        const createSpy = jest.spyOn(repo, 'create');
        const saveSpy = jest.spyOn(repo, 'save');
        await expect(service.create(dto)).resolves.toEqual(serviceEntity);
        expect(createSpy).toHaveBeenCalledWith(dto);
        expect(saveSpy).toHaveBeenCalled();
    });

    it('returns all services', async () => {
        const findSpy = jest.spyOn(repo, 'find');
        await expect(service.findAll()).resolves.toEqual([serviceEntity]);
        expect(findSpy).toHaveBeenCalled();
    });

    it('returns a service by id', async () => {
        const findOneSpy = jest.spyOn(repo, 'findOne');
        await expect(service.findOne(1)).resolves.toBe(serviceEntity);
        expect(findOneSpy).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('throws when service not found', async () => {
        const findOneSpy = jest.spyOn(repo, 'findOne').mockResolvedValue(null);
        await expect(service.findOne(2)).rejects.toBeInstanceOf(
            NotFoundException,
        );
        expect(findOneSpy).toHaveBeenCalledWith({ where: { id: 2 } });
    });

    it('updates a service', async () => {
        const dto: UpdateServiceDto = { name: 'New' };
        const updateSpy = jest.spyOn(repo, 'update');
        await expect(service.update(1, dto)).resolves.toBe(serviceEntity);
        expect(updateSpy).toHaveBeenCalledWith(1, dto);
    });

    it('removes a service', async () => {
        const deleteSpy = jest.spyOn(repo, 'delete');
        await expect(service.remove(1)).resolves.toBeUndefined();
        expect(deleteSpy).toHaveBeenCalledWith(1);
    });
});
