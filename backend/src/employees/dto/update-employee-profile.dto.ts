import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsOptional,
    IsString,
    IsMobilePhone,
    Matches,
} from 'class-validator';

export class UpdateEmployeeProfileDto {
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
        example: 'Eva',
    })
    @IsString()
    @IsOptional()
    firstName?: string;

    @ApiPropertyOptional({
        description: 'Updated last name',
        type: String,
        example: 'Kowalska',
    })
    @IsString()
    @IsOptional()
    lastName?: string;

    @ApiPropertyOptional({
        description: 'Updated phone number',
        type: String,
        example: '+48123456789',
    })
    @IsMobilePhone('pl-PL')
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional({
        description: 'New account password',
        type: String,
        example: 'NewPass123!'
    })
    @IsString()
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
    @IsOptional()
    password?: string;
}
