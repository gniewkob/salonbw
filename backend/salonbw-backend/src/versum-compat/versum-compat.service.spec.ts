import { VersumCompatService } from './versum-compat.service';
import { AppointmentStatus } from '../appointments/appointment.entity';
import { PaymentMethod } from '../appointments/appointment.entity';

describe('VersumCompatService', () => {
    let service: VersumCompatService;

    const appointmentsRepository = {
        findOne: jest.fn(),
        save: jest.fn(),
        createQueryBuilder: jest.fn(),
    };

    const usersRepository = {
        find: jest.fn(),
    };

    const servicesRepository = {
        find: jest.fn(),
        createQueryBuilder: jest.fn(),
    };

    const serviceCategoriesRepository = {
        find: jest.fn(),
    };

    const employeeServicesRepository = {
        find: jest.fn(),
    };

    const timetablesRepository = {
        findOne: jest.fn(),
    };

    beforeEach(() => {
        jest.resetAllMocks();
        service = new VersumCompatService(
            appointmentsRepository as never,
            usersRepository as never,
            servicesRepository as never,
            serviceCategoriesRepository as never,
            employeeServicesRepository as never,
            timetablesRepository as never,
        );
    });

    it('returns compat payload for GetNetGrossTranslationType', async () => {
        const response = await service.graphql({
            operationName: 'GetNetGrossTranslationType',
        });

        expect(response).toEqual({
            data: {
                viewer: {
                    branch: {
                        netGrossTranslationType: 'STANDARD',
                        __typename: 'Branch',
                    },
                    __typename: 'Viewer',
                },
            },
        });
    });

    it('finalizeEvent maps not_an_appointment to no_show', async () => {
        const appointment = {
            id: 101,
            clientId: 2,
            employeeId: 3,
            serviceId: 4,
            serviceVariantId: null,
            status: AppointmentStatus.Scheduled,
            paymentMethod: PaymentMethod.Card,
            paidAmount: null,
            tipAmount: null,
            discount: null,
            startTime: new Date('2026-02-04T09:00:00.000Z'),
            endTime: new Date('2026-02-04T10:00:00.000Z'),
            finalizedAt: null,
            finalizedBy: null,
            reservedOnline: false,
            notes: null,
            createdAt: new Date('2026-02-04T08:00:00.000Z'),
            updatedAt: new Date('2026-02-04T08:00:00.000Z'),
            client: {
                id: 2,
                name: 'Klient Test',
                phone: null,
                email: null,
                description: null,
            },
            employee: {
                id: 3,
                name: 'Pracownik Test',
            },
            service: {
                id: 4,
                name: 'Usługa Test',
                price: 100,
                vatRate: 23,
            },
            serviceVariant: null,
        };

        appointmentsRepository.findOne.mockResolvedValue(appointment);
        appointmentsRepository.save.mockImplementation(
            async (entity) => entity,
        );

        const result = await service.finalizeEvent(101, { id: 999 } as never, {
            not_an_appointment: true,
        });

        expect(appointment.status).toBe(AppointmentStatus.NoShow);
        expect(result).toMatchObject({ success: true });
    });
});
