import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsEnum,
    IsMobilePhone,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';
import { Role } from '../../users/role.enum';

export class CreateEmployeeDto {
    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsString()
    firstName: string;

    @ApiProperty()
    @IsString()
    lastName: string;

    @ApiProperty()
    @IsNumber()
    commissionBase: number;

    @ApiPropertyOptional()
    @IsMobilePhone()
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional({ enum: Role })
    @IsEnum(Role)
    @IsOptional()
    role?: Role;
}
