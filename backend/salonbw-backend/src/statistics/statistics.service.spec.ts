import { Between, Repository } from 'typeorm';
import { StatisticsService } from './statistics.service';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';
import { User } from '../users/user.entity';
import { Review } from '../reviews/review.entity';
import { Commission } from '../commissions/commission.entity';
import { Timetable } from '../timetables/entities/timetable.entity';
import { TimetableException } from '../timetables/entities/timetable-exception.entity';
import { ProductMovement } from '../warehouse/entities/product-movement.entity';
import { Product } from '../products/product.entity';
import { Role } from '../users/role.enum';

type MockRepository<T extends object> = Partial<
    Record<keyof Repository<T>, jest.Mock>
> & {
    createQueryBuilder?: jest.Mock;
};

function createStatisticsService({
    appointments = [],
    employees = [],
    reviewRows = [],
}: {
    appointments?: Partial<Appointment>[];
    employees?: Partial<User>[];
    reviewRows?: Array<{
        employeeId: string;
        avg: string | null;
        count: string;
    }>;
}) {
    const appointmentRepository: MockRepository<Appointment> = {
        find: jest.fn().mockResolvedValue(appointments),
        createQueryBuilder: jest.fn(() => ({
            leftJoin: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            getRawMany: jest.fn().mockResolvedValue([]),
        })),
    };
    const userRepository: MockRepository<User> = {
        find: jest.fn().mockResolvedValue(employees),
    };
    const reviewRepository: MockRepository<Review> = {
        createQueryBuilder: jest.fn(() => ({
            innerJoin: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            getRawMany: jest.fn().mockResolvedValue(reviewRows),
        })),
    };

    const service = new StatisticsService(
        appointmentRepository as Repository<Appointment>,
        userRepository as Repository<User>,
        reviewRepository as Repository<Review>,
        {} as Repository<Timetable>,
        {} as Repository<TimetableException>,
        {} as Repository<Commission>,
        {} as Repository<ProductMovement>,
        {} as Repository<Product>,
    );

    return {
        service,
        appointmentRepository,
        userRepository,
    };
}

describe('StatisticsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('keeps employees with zero appointments in employee ranking', async () => {
        const from = new Date('2026-03-01T00:00:00.000Z');
        const to = new Date('2026-03-31T23:59:59.999Z');

        const { service, appointmentRepository, userRepository } =
            createStatisticsService({
                employees: [
                    { id: 1, name: 'Anna', role: Role.Employee },
                    { id: 2, name: 'Bartek', role: Role.Employee },
                ],
                appointments: [
                    {
                        id: 10,
                        employeeId: 1,
                        startTime: new Date('2026-03-10T10:00:00.000Z'),
                        status: AppointmentStatus.Completed,
                        tipAmount: 20,
                        paidAmount: 100,
                        service: {
                            duration: 60,
                            price: 100,
                        } as Appointment['service'],
                        serviceVariant: null,
                    },
                ],
                reviewRows: [
                    {
                        employeeId: '1',
                        avg: '4.5',
                        count: '2',
                    },
                ],
            });

        const result = await service.getEmployeeRanking(from, to);

        expect(userRepository.find).toHaveBeenCalledWith({
            where: { role: Role.Employee },
        });
        expect(appointmentRepository.find).toHaveBeenCalledWith({
            where: {
                startTime: Between(from, to),
                status: AppointmentStatus.Completed,
            },
            relations: ['service', 'serviceVariant'],
        });
        expect(result).toEqual([
            expect.objectContaining({
                employeeId: 1,
                employeeName: 'Anna',
                revenue: 100,
                appointments: 1,
                completedAppointments: 1,
                rating: 4.5,
                reviewCount: 2,
            }),
            expect.objectContaining({
                employeeId: 2,
                employeeName: 'Bartek',
                revenue: 0,
                appointments: 0,
                completedAppointments: 0,
                rating: 0,
                reviewCount: 0,
            }),
        ]);
    });

    it('aggregates employee activity from a single appointment query', async () => {
        const date = new Date('2026-03-11T12:00:00.000Z');

        const { service, appointmentRepository } = createStatisticsService({
            employees: [
                { id: 1, name: 'Anna', role: Role.Employee },
                { id: 2, name: 'Bartek', role: Role.Employee },
            ],
            appointments: [
                {
                    id: 10,
                    employeeId: 1,
                    startTime: new Date('2026-03-11T09:00:00.000Z'),
                    endTime: new Date('2026-03-11T10:30:00.000Z'),
                    status: AppointmentStatus.Completed,
                },
                {
                    id: 11,
                    employeeId: 1,
                    startTime: new Date('2026-03-11T11:00:00.000Z'),
                    endTime: new Date('2026-03-11T12:00:00.000Z'),
                    status: AppointmentStatus.Completed,
                },
            ],
        });

        const result = await service.getEmployeeActivity(date);

        expect(appointmentRepository.find).toHaveBeenCalledTimes(1);
        expect(result.employees).toEqual([
            {
                employeeId: 1,
                employeeName: 'Anna',
                workTimeMinutes: 150,
                appointmentsCount: 2,
            },
            {
                employeeId: 2,
                employeeName: 'Bartek',
                workTimeMinutes: 0,
                appointmentsCount: 0,
            },
        ]);
        expect(result.totals).toEqual({
            workTimeMinutes: 150,
            appointmentsCount: 2,
        });
    });
});
