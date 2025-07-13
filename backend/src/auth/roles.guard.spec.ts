import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../users/role.enum';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflector: { getAllAndOverride: jest.Mock };

    beforeEach(() => {
        reflector = { getAllAndOverride: jest.fn() } as any;
        guard = new RolesGuard(reflector as unknown as Reflector);
    });

    function createContext(role?: Role): ExecutionContext {
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
});
