import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsString,
    IsOptional,
    IsBoolean,
    IsMobilePhone,
} from 'class-validator';

export class UpdateCustomerDto {
    @ApiPropertyOptional({
        description: 'Updated email address',
        type: String,
        example: 'new@example.com',
    })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional({
        description: 'Updated first name',
        type: String,
        example: 'Anna',
    })
    @IsString()
    @IsOptional()
    firstName?: string;

    @ApiPropertyOptional({
        description: 'Updated last name',
        type: String,
        example: 'Nowak',
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
        description: 'Updated marketing consent',
        type: Boolean,
        example: true,
    })
    @IsBoolean()
    @IsOptional()
    marketingConsent?: boolean;
}
