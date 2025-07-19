import {
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    IsNotEmpty,
    MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../role.enum';

export class CreateUserDto {
    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty()
    @MinLength(6)
    password: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty({ enum: Role, required: false })
    @IsEnum(Role)
    @IsOptional()
    role?: Role;
}
