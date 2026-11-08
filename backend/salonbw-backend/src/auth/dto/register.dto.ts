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

    // Legacy field: retained for older clients but never required for the
    // processing necessary to create an account or manage a booking.
    @IsOptional()
    @IsBoolean()
    @ApiProperty({
        description: 'Legacy GDPR consent field (optional, not a booking requirement)',
        required: false,
        example: false,
    })
    gdprConsent?: boolean;

    @Equals(true, {
        message: 'Akceptacja regulaminu jest wymagana',
    })
    @ApiProperty({
        description: 'Terms of service (regulamin) consent — must be true',
        example: true,
    })
    termsConsent: true;

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

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Consent to receive WhatsApp messages',
        required: false,
        example: false,
    })
    whatsappConsent?: boolean;
}
