import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsOptional,
    IsString,
    IsMobilePhone,
    Matches,
} from 'class-validator';

export class UpdateEmployeeProfileDto {
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
    @IsMobilePhone('pl-PL')
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional()
    @IsString()
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
    @IsOptional()
    password?: string;
}
