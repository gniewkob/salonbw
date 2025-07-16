import { SetMetadata } from '@nestjs/common';
import { Role } from '../users/role.enum';
import { EmployeeRole } from '../employees/employee-role.enum';

export type AnyRole = Role | EmployeeRole;

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AnyRole[]) => SetMetadata(ROLES_KEY, roles);
