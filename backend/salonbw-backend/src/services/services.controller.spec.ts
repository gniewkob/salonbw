import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { Service } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';

describe('ServicesController', () => {
    let controller: ServicesController;
    let service: jest.Mocked<ServicesService>;
    let serviceEntity: Service;

    beforeEach(() => {
        serviceEntity = {
            id: 1,
            name: 'Cut',
            description: 'desc',
            publicDescription: 'Public description',
            privateDescription: 'Internal recipe notes',
            duration: 30,
            price: 50,
            priceType: 'fixed',
            category: 'Hair',
            commissionPercent: 10,
            isActive: true,
            onlineBooking: true,
            sortOrder: 1,
            createdAt: new Date('2026-09-01T08:00:00.000Z'),
            updatedAt: new Date('2026-09-01T08:00:00.000Z'),
            variants: [
                {
                    id: 2,
                    serviceId: 1,
                    name: 'Long hair',
                    duration: 45,
                    price: 75,
                    priceType: 'fixed',
                    sortOrder: 1,
                    isActive: true,
                    createdAt: new Date('2026-09-01T08:00:00.000Z'),
                    updatedAt: new Date('2026-09-01T08:00:00.000Z'),
                },
            ],
        };

        service = {
            findAll: jest.fn().mockResolvedValue([serviceEntity]),
            findAllWithRelations: jest.fn().mockResolvedValue([serviceEntity]),
            findActiveForOnlineBooking: jest
                .fn()
                .mockResolvedValue([serviceEntity]),
            findPublicForLanding: jest.fn().mockResolvedValue([serviceEntity]),
            findByCategory: jest.fn().mockResolvedValue([serviceEntity]),
            findOne: jest.fn().mockResolvedValue(serviceEntity),
            create: jest.fn((dto: CreateServiceDto, user: User) => {
                void dto;
                void user;
                return Promise.resolve(serviceEntity);
            }),
            update: jest.fn((id: number, dto: UpdateServiceDto, user: User) => {
                void id;
                void dto;
                void user;
                return Promise.resolve(serviceEntity);
            }),
            remove: jest.fn((id: number, user: User) => {
                void id;
                void user;
                return Promise.resolve(undefined);
            }),
        } as jest.Mocked<ServicesService>;
        controller = new ServicesController(service);
    });

    it('delegates findAll to service', async () => {
        const findAllSpy = jest.spyOn(service, 'findAll');
        await expect(
            controller.findAll(
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                { role: Role.Admin },
            ),
        ).resolves.toEqual([
            expect.objectContaining({
                id: 1,
                privateDescription: 'Internal recipe notes',
                commissionPercent: 10,
            }),
        ]);
        expect(findAllSpy).toHaveBeenCalled();
    });

    it('returns a public catalog without commission and private fields', async () => {
        const result = await controller.findPublic();

        expect(result).toEqual([
            expect.objectContaining({
                id: 1,
                name: 'Cut',
                description: 'desc',
                publicDescription: 'Public description',
                duration: 30,
                price: 50,
                variants: [
                    expect.objectContaining({
                        id: 2,
                        name: 'Long hair',
                        duration: 45,
                        price: 75,
                    }),
                ],
            }),
        ]);
        expect(JSON.stringify(result)).not.toContain('privateDescription');
        expect(JSON.stringify(result)).not.toContain('commissionPercent');
        expect(JSON.stringify(result)).not.toContain('createdAt');
    });

    it('returns the safe catalog to a client while preserving admin fields', async () => {
        const findAll = controller.findAll as unknown as (
            categoryId?: string,
            isActive?: string,
            onlineBooking?: string,
            includeVariants?: string,
            includeCategory?: string,
            user?: { role: string },
        ) => Promise<Service[]>;

        const clientResult = await findAll.call(
            controller,
            undefined,
            undefined,
            undefined,
            'true',
            'true',
            { role: 'client' },
        );
        const adminResult = await findAll.call(
            controller,
            undefined,
            undefined,
            undefined,
            'true',
            'true',
            { role: 'admin' },
        );

        expect(JSON.stringify(clientResult)).not.toContain(
            'Internal recipe notes',
        );
        expect(JSON.stringify(clientResult)).not.toContain('commissionPercent');
        expect(adminResult[0]).toMatchObject({
            privateDescription: 'Internal recipe notes',
            commissionPercent: 10,
        });
        expect(JSON.stringify(adminResult)).not.toContain('employeeServices');
        expect(JSON.stringify(adminResult)).not.toContain('recipeItems');
    });

    it('delegates findOne to service', async () => {
        const findOneSpy = jest.spyOn(service, 'findOne');
        await expect(
            controller.findOne(1, { role: Role.Admin }),
        ).resolves.toEqual(
            expect.objectContaining({
                id: 1,
                privateDescription: 'Internal recipe notes',
                commissionPercent: 10,
            }),
        );
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
        const user = { userId: 1 };
        await expect(controller.create(dto, user)).resolves.toBe(serviceEntity);
        expect(createSpy).toHaveBeenCalledWith(dto, { id: 1 });
    });

    it('delegates update to service', async () => {
        const dto: UpdateServiceDto = { name: 'New' };
        const updateSpy = jest.spyOn(service, 'update');
        const user = { userId: 1 };
        await expect(controller.update(1, dto, user)).resolves.toBe(
            serviceEntity,
        );
        expect(updateSpy).toHaveBeenCalledWith(1, dto, { id: 1 });
    });

    it('delegates remove to service', async () => {
        const removeSpy = jest.spyOn(service, 'remove');
        const user = { userId: 1 };
        await expect(controller.remove(1, user)).resolves.toBeUndefined();
        expect(removeSpy).toHaveBeenCalledWith(1, { id: 1 });
    });
});
