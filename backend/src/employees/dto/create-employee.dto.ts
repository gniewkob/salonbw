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
    @ApiProperty({
        description: 'Employee email address',
        type: String,
        example: 'employee@example.com',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'First name of the employee',
        type: String,
        example: 'Jane',
    })
    @IsString()
    firstName: string;

    @ApiProperty({
        description: 'Last name of the employee',
        type: String,
        example: 'Doe',
    })
    @IsString()
    lastName: string;

    @ApiProperty({
        description: 'Base commission percentage for the employee',
        type: Number,
        example: 20,
    })
    @IsNumber()
    commissionBase: number;

    @ApiPropertyOptional({
        description: 'Contact phone number',
        type: String,
        example: '+48123123123',
    })
    @IsMobilePhone()
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional({
        enum: Role,
        description: 'Role assigned to the employee',
        example: Role.Employee,
    })
    @IsEnum(Role)
    @IsOptional()
    role?: Role;
}
