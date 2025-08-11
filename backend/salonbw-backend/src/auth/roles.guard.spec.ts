import {
    ForbiddenException,
    UnauthorizedException,
    ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../users/role.enum';

describe('RolesGuard', () => {
    let reflector: Reflector;
    let guard: RolesGuard;

    beforeEach(() => {
        reflector = new Reflector();
        guard = new RolesGuard(reflector);
    });

    interface RequestWithUser {
        user?: { role: Role };
    }

    const createContext = (role?: Role): ExecutionContext => {
        const request: RequestWithUser = { user: role ? { role } : undefined };
        return {
            switchToHttp: () => ({ getRequest: () => request }),
            getHandler: () => ({}),
            getClass: () => ({}),
        } as unknown as ExecutionContext;
    };

    it('throws UnauthorizedException if no user is present', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
            Role.Admin,
        ]);
        const ctx = createContext();
        expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    it('returns true when roles match', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
            Role.Client,
        ]);
        const ctx = createContext(Role.Admin);
        expect(guard.canActivate(ctx)).toBe(true);
    });

    it('throws ForbiddenException when role does not match', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
            Role.Admin,
        ]);
        const ctx = createContext(Role.Client);
        expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
});
