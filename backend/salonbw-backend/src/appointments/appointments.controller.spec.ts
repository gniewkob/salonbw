import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Appointment } from './appointment.entity';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Role } from '../users/role.enum';

describe('AppointmentsController staff read scope', () => {
    const findOne = jest.fn();
    const create = jest.fn();
    const controller = new AppointmentsController({
        findOne,
        create,
    } as unknown as AppointmentsService);

    beforeEach(() => {
        findOne.mockReset();
        create.mockReset();
    });

    it('exposes a direct appointment read handler for calendar deep links', () => {
        expect(
            (
                controller as unknown as {
                    findOneForStaff?: unknown;
                }
            ).findOneForStaff,
        ).toBeDefined();
    });

    it('allows an employee to read their own appointment', async () => {
        const appointment = {
            id: 42,
            employee: { id: 7 },
        } as Appointment;
        findOne.mockResolvedValue(appointment);

        await expect(
            controller.findOneForStaff(42, {
                userId: 7,
                role: Role.Employee,
            }),
        ).resolves.toBe(appointment);
    });

    it('denies an employee access to another employee appointment', async () => {
        findOne.mockResolvedValue({
            id: 42,
            employee: { id: 99 },
        } as Appointment);

        await expect(
            controller.findOneForStaff(42, {
                userId: 7,
                role: Role.Employee,
            }),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows reception to read an appointment assigned to any employee', async () => {
        const appointment = {
            id: 42,
            employee: { id: 99 },
        } as Appointment;
        findOne.mockResolvedValue(appointment);

        await expect(
            controller.findOneForStaff(42, {
                userId: 3,
                role: Role.Receptionist,
            }),
        ).resolves.toBe(appointment);
    });

    it('returns not found for a missing appointment', async () => {
        findOne.mockResolvedValue(null);

        await expect(
            controller.findOneForStaff(404, {
                userId: 1,
                role: Role.Admin,
            }),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('does not let an employee reassign their appointment to a colleague', async () => {
        findOne.mockResolvedValue({
            id: 42,
            employee: { id: 7 },
        } as Appointment);

        await expect(
            controller.reschedule(
                42,
                {
                    startTime: '2026-09-10T09:00:00.000Z',
                    employeeId: 99,
                },
                { userId: 7, role: Role.Employee },
            ),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('does not let an employee create an appointment for a colleague', async () => {
        create.mockResolvedValue({ id: 42 });

        expect(() =>
            controller.create(
                {
                    clientId: 5,
                    employeeId: 99,
                    serviceId: 10,
                    startTime: '2026-09-10T09:00:00.000Z',
                },
                { userId: 7, role: Role.Employee },
            ),
        ).toThrow(ForbiddenException);
        expect(create).not.toHaveBeenCalled();
    });

    it.each([
        ['appointment conflict check', 'checkConflicts'],
        ['internal note update', 'updateNotes'],
        ['client note update', 'updateClientNote'],
        ['usage suggestion read', 'getUsageSuggestions'],
        ['message thread read', 'listMessages'],
        ['message send', 'addMessage'],
    ])('denies another employee appointment in %s', async (_label, method) => {
        findOne.mockResolvedValue({
            id: 42,
            employee: { id: 99 },
        } as Appointment);

        const user = { userId: 7, role: Role.Employee };
        const action = controller[method as keyof AppointmentsController] as (
            ...args: unknown[]
        ) => Promise<unknown>;
        const argsByMethod: Record<string, unknown[]> = {
            checkConflicts: [
                42,
                '2026-09-10T09:00:00.000Z',
                '2026-09-10T10:00:00.000Z',
                user,
                undefined,
            ],
            updateNotes: [42, { internalNote: 'test' }, user],
            updateClientNote: [42, { clientComment: 'test' }, user],
            getUsageSuggestions: [42, user],
            listMessages: [42, user],
            addMessage: [42, { body: 'test' }, user],
        };

        await expect(
            action.apply(controller, argsByMethod[method]),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });
});
