import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsString,
    IsOptional,
    IsBoolean,
    IsMobilePhone,
} from 'class-validator';

export class UpdateCustomerDto {
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

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    marketingConsent?: boolean;
}
