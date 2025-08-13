import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServicesService } from './services.service';
import { Service } from './service.entity';
import { NotFoundException } from '@nestjs/common';

describe('ServicesService', () => {
  let service: ServicesService;
  let repo: jest.Mocked<Repository<Service>>;

  const mockRepository = () => ({
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation(async (entity) => ({ id: 1, ...entity })),
    find: jest.fn().mockResolvedValue([{ id: 1 } as Service]),
    findOne: jest.fn().mockResolvedValue({ id: 1 } as Service),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: getRepositoryToken(Service), useValue: mockRepository() },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    repo = module.get(getRepositoryToken(Service));
  });

  it('creates a service', async () => {
    const dto = { name: 'Cut', description: 'Hair cut', duration: 30, price: 10 } as any;
    await expect(service.create(dto)).resolves.toEqual({ id: 1, ...dto });
    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalled();
  });

  it('returns all services', async () => {
    await expect(service.findAll()).resolves.toEqual([{ id: 1 }]);
    expect(repo.find).toHaveBeenCalled();
  });

  it('returns a service by id', async () => {
    await expect(service.findOne(1)).resolves.toEqual({ id: 1 });
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('throws when service not found', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne(2)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates a service', async () => {
    const dto = { name: 'New' } as any;
    await expect(service.update(1, dto)).resolves.toEqual({ id: 1 });
    expect(repo.update).toHaveBeenCalledWith(1, dto);
  });

  it('removes a service', async () => {
    await service.remove(1);
    expect(repo.delete).toHaveBeenCalledWith(1);
  });
});

