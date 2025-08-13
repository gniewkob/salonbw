import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

describe('ServicesController', () => {
  let controller: ServicesController;
  let service: jest.Mocked<ServicesService>;

  beforeEach(() => {
    service = {
      findAll: jest.fn().mockResolvedValue(['all'] as any),
      findOne: jest.fn().mockResolvedValue('one' as any),
      create: jest.fn().mockResolvedValue('created' as any),
      update: jest.fn().mockResolvedValue('updated' as any),
      remove: jest.fn().mockResolvedValue(undefined),
    } as any;
    controller = new ServicesController(service);
  });

  it('delegates findAll to service', async () => {
    await expect(controller.findAll()).resolves.toEqual(['all']);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('delegates findOne to service', async () => {
    await expect(controller.findOne(1)).resolves.toBe('one');
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('delegates create to service', async () => {
    const dto = { name: 'Cut' } as any;
    await expect(controller.create(dto)).resolves.toBe('created');
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('delegates update to service', async () => {
    const dto = { name: 'New' } as any;
    await expect(controller.update(1, dto)).resolves.toBe('updated');
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('delegates remove to service', async () => {
    await expect(controller.remove(1)).resolves.toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});

