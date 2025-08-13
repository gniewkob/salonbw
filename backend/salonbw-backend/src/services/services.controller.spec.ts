import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { Service } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

describe('ServicesController', () => {
  let controller: ServicesController;
  let service: jest.Mocked<ServicesService>;
  let serviceEntity: Service;
  let findAll: jest.Mock;
  let findOne: jest.Mock;
  let create: jest.Mock;
  let update: jest.Mock;
  let remove: jest.Mock;

  beforeEach(() => {
    serviceEntity = {
      id: 1,
      name: 'Cut',
      description: 'desc',
      duration: 30,
      price: 50,
      category: 'Hair',
      commissionPercent: 10,
    };

    service = {
      findAll: jest.fn().mockResolvedValue([serviceEntity]),
      findOne: jest.fn().mockResolvedValue(serviceEntity),
      create: jest.fn().mockResolvedValue(serviceEntity),
      update: jest.fn().mockResolvedValue(serviceEntity),
      remove: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ServicesService>;
    ({ findAll, findOne, create, update, remove } = service);
    controller = new ServicesController(service);
  });

  it('delegates findAll to service', async () => {
    const callFindAll = () => controller.findAll();
    await expect(callFindAll()).resolves.toEqual([serviceEntity]);
    expect(findAll).toHaveBeenCalled();
  });

  it('delegates findOne to service', async () => {
    const callFindOne = () => controller.findOne(1);
    await expect(callFindOne()).resolves.toBe(serviceEntity);
    expect(findOne).toHaveBeenCalledWith(1);
  });

  it('delegates create to service', async () => {
    const dto: CreateServiceDto = {
      name: 'Cut',
      description: 'desc',
      duration: 30,
      price: 50,
      category: 'Hair',
      commissionPercent: 10,
    };
    const callCreate = () => controller.create(dto);
    await expect(callCreate()).resolves.toBe(serviceEntity);
    expect(create).toHaveBeenCalledWith(dto);
  });

  it('delegates update to service', async () => {
    const dto: UpdateServiceDto = { name: 'New' };
    const callUpdate = () => controller.update(1, dto);
    await expect(callUpdate()).resolves.toBe(serviceEntity);
    expect(update).toHaveBeenCalledWith(1, dto);
  });

  it('delegates remove to service', async () => {
    const callRemove = () => controller.remove(1);
    await expect(callRemove()).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledWith(1);
  });
});

