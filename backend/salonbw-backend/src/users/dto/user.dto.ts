import { Role } from '../role.enum';

export class UserDto {
    id: number;
    email: string;
    name: string;
    role: Role;
    commissionBase: number;
}
