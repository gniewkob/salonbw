import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { EmployeesController } from './employees.controller';
import { UsersService } from './users.service';
import { Role } from './role.enum';
import { ROLES_KEY } from '../auth/roles.decorator';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { Appointment } from '../appointments/appointment.entity';
import type { User } from './user.entity';

describe('Admin-only calendar staff roster configuration', () => {
    const owner = {
        id: 29,
        name: 'Właścicielka',
        role: Role.Admin,
        isSystemAdmin: false,
        calendarStaffActive: true,
    } as User;

    const synthetic = {
        id: 77,
        name: 'Personel testowy',
        role: Role.Employee,
        isSystemAdmin: false,
        calendarStaffActive: true,
    } as User;

    const findById = jest.fn();
    const findAll = jest.fn();
    const updateCalendarStaffActive = jest.fn();
    const logAction = jest.fn();

    const controller = new EmployeesController(
        {
            findById,
            findAll,
            updateCalendarStaffActive,
        } as unknown as UsersService,
        { logAction } as unknown as LogService,
        {} as Repository<Appointment>,
    );

    beforeEach(() => {
        jest.clearAllMocks();
        findById.mockResolvedValue(synthetic);
        findAll.mockResolvedValue([owner, synthetic]);
        updateCalendarStaffActive.mockImplementation(
            async (id: number, active: boolean) => ({
                ...synthetic,
                id,
                calendarStaffActive: active,
            }),
        );
        logAction.mockResolvedValue(undefined);
    });

    it('has an explicit admin-only HTTP role guard', () => {
        expect(
            Reflect.getMetadata(
                ROLES_KEY,
                EmployeesController.prototype.setCalendarStaffActive,
            ) as Role[],
        ).toEqual([Role.Admin]);
    });

    it('deactivates a synthetic employee without deleting their history and audits the change', async () => {
        await expect(
            controller.setCalendarStaffActive(77, { active: false }, owner),
        ).resolves.toEqual(
            expect.objectContaining({
                id: 77,
                calendarStaffActive: false,
            }),
        );
        expect(updateCalendarStaffActive).toHaveBeenCalledWith(77, false);
        expect(logAction).toHaveBeenCalledWith(
            owner,
            LogAction.EMPLOYEE_UPDATED,
            expect.objectContaining({
                employeeId: 77,
                previousActive: true,
                active: false,
            }),
        );
    });

    it('rejects disabling the last active stylist', async () => {
        findById.mockResolvedValue(owner);
        findAll.mockResolvedValue([
            owner,
            {
                ...synthetic,
                calendarStaffActive: false,
            },
        ]);
        await expect(
            controller.setCalendarStaffActive(29, { active: false }, owner),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(updateCalendarStaffActive).not.toHaveBeenCalled();
    });

    it.each([
        [Role.Client, false],
        [Role.Receptionist, false],
        [Role.Admin, true],
    ])(
        'rejects non-bookable accounts (%s, technical=%s)',
        async (role, technical) => {
            findById.mockResolvedValue({
                ...synthetic,
                role,
                isSystemAdmin: technical,
            });
            await expect(
                controller.setCalendarStaffActive(77, { active: false }, owner),
            ).rejects.toBeInstanceOf(NotFoundException);
            expect(updateCalendarStaffActive).not.toHaveBeenCalled();
        },
    );

    it('does not change or re-audit an unchanged roster flag', async () => {
        await controller.setCalendarStaffActive(77, { active: true }, owner);
        expect(updateCalendarStaffActive).not.toHaveBeenCalled();
        expect(logAction).not.toHaveBeenCalled();
    });

    it('can reactivate a former employee even if no active roster remains', async () => {
        findById.mockResolvedValue({
            ...synthetic,
            calendarStaffActive: false,
        });
        await expect(
            controller.setCalendarStaffActive(77, { active: true }, owner),
        ).resolves.toEqual(
            expect.objectContaining({ calendarStaffActive: true }),
        );
        expect(updateCalendarStaffActive).toHaveBeenCalledWith(77, true);
        expect(findAll).not.toHaveBeenCalled();
    });
});
