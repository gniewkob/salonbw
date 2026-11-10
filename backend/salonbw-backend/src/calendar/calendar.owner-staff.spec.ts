import { FindOperator } from 'typeorm';
import { CalendarService } from './calendar.service';
import { Role } from '../users/role.enum';
import type { User } from '../users/user.entity';

type CalendarStaffQuery = {
    where: {
        role: FindOperator<Role>;
        isSystemAdmin: boolean;
        id?: FindOperator<number>;
    };
    order: { name: 'ASC' };
};

describe('CalendarService staff includes the salon owner, not system admins', () => {
    const build = () => {
        const owner = {
            id: 7,
            role: Role.Admin,
            isSystemAdmin: false,
            name: 'Właścicielka salonu',
        } as User;
        const repository = {
            find: jest.fn().mockResolvedValue([owner]),
        };
        const service = Object.create(CalendarService.prototype) as CalendarService;
        Object.defineProperty(service, 'userRepository', {
            value: repository,
            writable: false,
        });
        const load = (
            service as unknown as {
                getEmployees: (employeeIds?: number[]) => Promise<User[]>;
            }
        ).getEmployees.bind(service);
        return { load, repository, owner };
    };

    it('includes owner/admin and legacy employee but excludes technical admins', async () => {
        const { load, repository, owner } = build();
        expect(await load()).toEqual([owner]);

        const query = repository.find.mock.calls[0][0] as CalendarStaffQuery;
        expect(query.where.role).toBeInstanceOf(FindOperator);
        expect(query.where.role.value).toEqual([Role.Employee, Role.Admin]);
        expect(query.where.role.value).not.toContain(Role.Receptionist);
        expect(query.where.isSystemAdmin).toBe(false);
        expect(query.where.id).toBeUndefined();
        expect(query.order).toEqual({ name: 'ASC' });
    });

    it('applies the same technical-admin exclusion for a selected employee', async () => {
        const { load, repository } = build();
        await load([7]);
        const query = repository.find.mock.calls[0][0] as CalendarStaffQuery;
        expect(query.where.id?.value).toEqual([7]);
        expect(query.where.isSystemAdmin).toBe(false);
    });
});
