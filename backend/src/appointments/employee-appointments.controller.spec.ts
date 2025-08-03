import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EmployeeAppointmentsController } from './employee-appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Role } from '../users/role.enum';

describe('EmployeeAppointmentsController', () => {
    let controller: EmployeeAppointmentsController;
    let service: { findOneForUser: jest.Mock };

    beforeEach(async () => {
        service = { findOneForUser: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [EmployeeAppointmentsController],
            providers: [{ provide: AppointmentsService, useValue: service }],
        }).compile();

        controller = module.get(EmployeeAppointmentsController);
    });

    it('get returns appointment or throws', async () => {
        service.findOneForUser.mockResolvedValueOnce({ id: 1 });
        await expect(
            controller.get('1', { user: { id: 1, role: Role.Employee } } as any),
        ).resolves.toEqual({ id: 1 });

        service.findOneForUser.mockResolvedValueOnce(undefined);
        await expect(
            controller.get('2', { user: { id: 1, role: Role.Employee } } as any),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('get propagates forbidden errors', async () => {
        service.findOneForUser.mockRejectedValueOnce(new ForbiddenException());
        await expect(
            controller.get('1', { user: { id: 2, role: Role.Employee } } as any),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });
});
