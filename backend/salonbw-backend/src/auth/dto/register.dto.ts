import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNumber,
    IsBoolean,
    IsOptional,
    IsNotEmpty,
    IsDateString,
    IsArray,
    ValidateNested,
    Equals,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'User email address',
        example: 'user@example.com',
    })
    email: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'User full name', example: 'John Doe' })
    name: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'User password',
        example: 'SecurePassword123!',
    })
    password: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'International phone number',
        example: '+123456789',
        required: false,
    })
    phone?: string;

    @Equals(true, {
        message: 'Zgoda na przetwarzanie danych osobowych jest wymagana',
    })
    @ApiProperty({
        description: 'GDPR consent — must be true to register',
        example: true,
    })
    gdprConsent: true;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Consent to receive SMS marketing messages',
        required: false,
        example: false,
    })
    smsConsent?: boolean;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Consent to receive email marketing messages',
        required: false,
        example: false,
    })
    emailConsent?: boolean;
}
