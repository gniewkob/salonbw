import {
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    IsNotEmpty,
    MinLength,
} from 'class-validator';
import { Role } from '../role.enum';

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @MinLength(6)
    password: string;

    @IsString()
    name: string;

    @IsEnum(Role)
    @IsOptional()
    role?: Role;
}
