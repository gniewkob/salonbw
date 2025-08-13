/* eslint-disable @typescript-eslint/unbound-method */
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
        const { create, save } = repo;
        const dto = {
            name: 'Cut',
            description: 'Hair cut',
            duration: 30,
            price: 10,
        };
        const callCreate = () => service.create(dto);
        await expect(callCreate()).resolves.toEqual(serviceEntity);
        expect(create).toHaveBeenCalledWith(dto);
        expect(save).toHaveBeenCalled();
    });

    it('returns all services', async () => {
        const { find } = repo;
        const callFindAll = () => service.findAll();
        await expect(callFindAll()).resolves.toEqual([serviceEntity]);
        expect(find).toHaveBeenCalled();
    });

    it('returns a service by id', async () => {
        const { findOne } = repo;
        const callFindOne = () => service.findOne(1);
        await expect(callFindOne()).resolves.toBe(serviceEntity);
        expect(findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('throws when service not found', async () => {
        const { findOne } = repo;
        findOne.mockResolvedValue(null);
        const callFindOne = () => service.findOne(2);
        await expect(callFindOne()).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates a service', async () => {
        const { update } = repo;
        const dto: UpdateServiceDto = { name: 'New' };
        const callUpdate = () => service.update(1, dto);
        await expect(callUpdate()).resolves.toBe(serviceEntity);
        expect(update).toHaveBeenCalledWith(1, dto);
    });

    it('removes a service', async () => {
        const { delete: remove } = repo;
        const callRemove = () => service.remove(1);
        await expect(callRemove()).resolves.toBeUndefined();
        expect(remove).toHaveBeenCalledWith(1);
    });
});
