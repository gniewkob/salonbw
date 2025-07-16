import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../users/role.enum';
import { EmployeeRole } from '../employees/employee-role.enum';
import { AnyRole } from './roles.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflector: { getAllAndOverride: jest.Mock };

    beforeEach(() => {
        reflector = { getAllAndOverride: jest.fn() } as any;
        guard = new RolesGuard(reflector as unknown as Reflector);
    });

    function createContext(role?: AnyRole): ExecutionContext {
        return {
            switchToHttp: () => ({
                getRequest: () => (role ? { user: { role } } : {}),
            }),
            getHandler: () => ({}),
            getClass: () => ({}),
        } as any;
    }

    it('allows when no roles are required', () => {
        reflector.getAllAndOverride.mockReturnValue(undefined);
        const ctx = createContext(Role.Client);
        expect(guard.canActivate(ctx)).toBe(true);
    });

    it('allows user with matching role', () => {
        reflector.getAllAndOverride.mockReturnValue([Role.Admin]);
        const ctx = createContext(Role.Admin);
        expect(guard.canActivate(ctx)).toBe(true);
    });

    it('allows user with matching employee role', () => {
        reflector.getAllAndOverride.mockReturnValue([EmployeeRole.FRYZJER]);
        const ctx = createContext(EmployeeRole.FRYZJER);
        expect(guard.canActivate(ctx)).toBe(true);
    });

    it('throws when user missing', () => {
        reflector.getAllAndOverride.mockReturnValue([Role.Admin]);
        const ctx = createContext(undefined);
        expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('throws when role does not match', () => {
        reflector.getAllAndOverride.mockReturnValue([Role.Admin]);
        const ctx = createContext(Role.Client);
        expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('throws when employee role does not match', () => {
        reflector.getAllAndOverride.mockReturnValue([EmployeeRole.RECEPCJA]);
        const ctx = createContext(EmployeeRole.FRYZJER);
        expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
});
