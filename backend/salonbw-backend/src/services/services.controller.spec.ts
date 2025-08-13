import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { Service } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

describe('ServicesController', () => {
    let controller: ServicesController;
    let service: jest.Mocked<ServicesService>;
    let serviceEntity: Service;

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
        } as jest.Mocked<ServicesService>;
        controller = new ServicesController(service);
    });

    it('delegates findAll to service', async () => {
        const findAllSpy = jest.spyOn(service, 'findAll');
        await expect(controller.findAll()).resolves.toEqual([serviceEntity]);
        expect(findAllSpy).toHaveBeenCalled();
    });

    it('delegates findOne to service', async () => {
        const findOneSpy = jest.spyOn(service, 'findOne');
        await expect(controller.findOne(1)).resolves.toBe(serviceEntity);
        expect(findOneSpy).toHaveBeenCalledWith(1);
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
        const createSpy = jest.spyOn(service, 'create');
        await expect(controller.create(dto)).resolves.toBe(serviceEntity);
        expect(createSpy).toHaveBeenCalledWith(dto);
    });

    it('delegates update to service', async () => {
        const dto: UpdateServiceDto = { name: 'New' };
        const updateSpy = jest.spyOn(service, 'update');
        await expect(controller.update(1, dto)).resolves.toBe(serviceEntity);
        expect(updateSpy).toHaveBeenCalledWith(1, dto);
    });

    it('delegates remove to service', async () => {
        const removeSpy = jest.spyOn(service, 'remove');
        await expect(controller.remove(1)).resolves.toBeUndefined();
        expect(removeSpy).toHaveBeenCalledWith(1);
    });
});
