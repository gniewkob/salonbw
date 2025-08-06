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
    @ApiPropertyOptional({
        description: 'Updated email address',
        type: String,
        example: 'employee.new@example.com',
    })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional({
        description: 'Updated first name',
        type: String,
        example: 'Eve',
    })
    @IsString()
    @IsOptional()
    firstName?: string;

    @ApiPropertyOptional({
        description: 'Updated last name',
        type: String,
        example: 'Smith',
    })
    @IsString()
    @IsOptional()
    lastName?: string;

    @ApiPropertyOptional({
        description: 'Updated phone number',
        type: String,
        example: '+48123456789',
    })
    @IsMobilePhone()
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional({
        enum: Role,
        description: 'Updated role of the employee',
        example: Role.Admin,
    })
    @IsEnum(Role)
    @IsOptional()
    role?: Role;
}
