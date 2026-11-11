import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Role } from '../users/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        const request = context
            .switchToHttp()
            .getRequest<{ user?: { role: Role } }>();
        const user = request.user;
        if (!user) {
            throw new UnauthorizedException();
        }
        // Admins can manage salon-staff endpoints, but they must not be
        // implicitly authorized for client-only self-service actions.
        // Client ownership is enforced by the corresponding API service.
        const adminDelegation =
            user.role === Role.Admin &&
            requiredRoles.some(
                (role) => role === Role.Employee || role === Role.Receptionist,
            );
        if (requiredRoles.includes(user.role) || adminDelegation) {
            return true;
        }
        throw new ForbiddenException('Forbidden resource');
    }
}
