import {
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Role } from '../users/role.enum';
import { User } from '../users/user.entity';

/**
 * Deliberate overlap approval is an administrator-only capability.
 * Test both the HTTP controller and direct service entry point; the latter
 * is also called by integrations, jobs and internal code.
 */
describe('Forced reschedule authorization', () => {
    const startTime = '2099-11-02T10:00:00.000Z';

    it.each([Role.Client, Role.Employee, Role.Receptionist])(
        'returns 403 for %s before exposing an appointment',
        async (role) => {
            const findOne = jest.fn();
            const reschedule = jest.fn();
            const controller = new AppointmentsController({
                findOne,
                reschedule,
            } as unknown as AppointmentsService);

            await expect(
                controller.reschedule(
                    42,
                    { startTime, force: true },
                    { userId: 7, role },
                ),
            ).rejects.toBeInstanceOf(ForbiddenException);
            expect(findOne).not.toHaveBeenCalled();
            expect(reschedule).not.toHaveBeenCalled();
        },
    );

    it('propagates the administrator role for an explicitly forced move', async () => {
        const findOne = jest.fn().mockResolvedValue({
            id: 42,
            employee: { id: 7 },
        });
        const reschedule = jest.fn().mockResolvedValue(null);
        const controller = new AppointmentsController({
            findOne,
            reschedule,
        } as unknown as AppointmentsService);

        await expect(
            controller.reschedule(
                42,
                { startTime, force: true },
                { userId: 7, role: Role.Admin },
            ),
        ).rejects.toBeInstanceOf(NotFoundException);
        expect(reschedule).toHaveBeenCalledWith(
            42,
            new Date(startTime),
            undefined,
            undefined,
            true,
            expect.objectContaining({ id: 7, role: Role.Admin }),
        );
    });

    it.each([Role.Client, Role.Employee, Role.Receptionist])(
        'does not allow internal %s callers to bypass conflict policy',
        async (role) => {
            const service = Object.create(
                AppointmentsService.prototype,
            ) as AppointmentsService;
            const findOne = jest
                .spyOn(service, 'findOne')
                .mockResolvedValue(null);

            await expect(
                service.reschedule(
                    42,
                    new Date(startTime),
                    undefined,
                    undefined,
                    true,
                    { id: 7, role } as User,
                ),
            ).rejects.toBeInstanceOf(ForbiddenException);
            expect(findOne).not.toHaveBeenCalled();
        },
    );

    it('keeps ordinary non-forced changes available to staff', async () => {
        const service = Object.create(
            AppointmentsService.prototype,
        ) as AppointmentsService;
        const findOne = jest.spyOn(service, 'findOne').mockResolvedValue(null);
        await expect(
            service.reschedule(
                42,
                new Date(startTime),
                undefined,
                undefined,
                false,
                { id: 7, role: Role.Employee } as User,
            ),
        ).resolves.toBeNull();
        expect(findOne).toHaveBeenCalledWith(42);
    });
});
