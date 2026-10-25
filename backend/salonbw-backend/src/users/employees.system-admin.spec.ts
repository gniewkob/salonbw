import { NotFoundException } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { UsersService } from './users.service';
import { Role } from './role.enum';
import { LogService } from '../logs/log.service';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';

const accounts = [
    { id: 1, name: 'Salon owner', role: Role.Admin, isSystemAdmin: false },
    {
        id: 2,
        name: 'System administrator',
        role: Role.Admin,
        isSystemAdmin: true,
    },
    { id: 3, name: 'Stylist', role: Role.Employee, isSystemAdmin: false },
];
function controller() {
    return new EmployeesController(
        {
            findAll: jest.fn().mockResolvedValue(accounts),
            findById: jest.fn().mockResolvedValue(accounts[1]),
            updateName: jest.fn().mockResolvedValue(accounts[1]),
            remove: jest.fn(),
            updateCommissionBase: jest.fn(),
        } as unknown as UsersService,
        { logAction: jest.fn() } as unknown as LogService,
        {
            count: jest.fn().mockResolvedValue(0),
        } as unknown as Repository<Appointment>,
    );
}

describe('technical administrators are not salon staff', () => {
    it('keeps the salon owner but excludes the technical administrator from staff', async () => {
        const result = await controller().list({ userId: 1, role: Role.Admin });
        expect(result.map((u) => u.id)).toEqual([1, 3]);
    });
    it('excludes technical administrators from staff selectors', async () => {
        const result = await controller().staffOptions({});
        expect(result.map((u) => u.id)).toEqual([1, 3]);
    });
    it('does not expose a technical account as an employee record', async () => {
        expect(
            await controller().getOne(2, { userId: 1, role: Role.Admin }),
        ).toBeNull();
    });
    it.each(['remove', 'getCommissionBase', 'updateCommissionBase'] as const)(
        'rejects technical accounts in %s before changing staff data',
        async (operation) => {
            const instance = controller();
            const result =
                operation === 'updateCommissionBase'
                    ? instance.updateCommissionBase(2, { commissionBase: 10 })
                    : instance[operation](2);
            await expect(result).rejects.toBeInstanceOf(NotFoundException);
            const users = (
                instance as unknown as { usersService: UsersService }
            ).usersService;
            expect(users.remove).not.toHaveBeenCalled();
            expect(users.updateCommissionBase).not.toHaveBeenCalled();
        },
    );
    it('does not update a technical account through the employee editor', async () => {
        await expect(
            controller().update(2, { firstName: 'System', lastName: 'Admin' }),
        ).rejects.toBeInstanceOf(NotFoundException);
    });
});
