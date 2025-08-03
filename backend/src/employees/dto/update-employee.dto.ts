import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsEnum,
    IsMobilePhone,
    IsOptional,
    IsString,
} from 'class-validator';
import { Role } from '../../users/role.enum';

export class UpdateEmployeeDto {
    @ApiPropertyOptional()
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    firstName?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    lastName?: string;

    @ApiPropertyOptional()
    @IsMobilePhone()
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional({ enum: Role })
    @IsEnum(Role)
    @IsOptional()
    role?: Role;
}
