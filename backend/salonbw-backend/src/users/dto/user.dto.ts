import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNumber,
    IsBoolean,
    IsOptional,
    IsNotEmpty,
} from 'class-validator';

export class UserDto {
    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ description: 'Unique identifier', example: 1 })
    id: number;

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
    @ApiProperty({ description: 'User role', example: 'client' })
    role: string;

    @IsOptional()
    @ApiProperty({
        description: 'International phone number',
        example: '+123456789',
    })
    phone?: string | null;

    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ description: 'Commission base for the user', example: 0 })
    commissionBase: number;

    @IsBoolean()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Whether the user receives notifications',
        example: true,
    })
    receiveNotifications: boolean;

    @IsBoolean()
    @ApiProperty({ description: 'Operational panel notifications' })
    notifyPanel: boolean;

    @IsBoolean()
    @ApiProperty({ description: 'Operational appointment SMS notifications' })
    notifySms: boolean;

    @IsBoolean()
    @ApiProperty({
        description: 'Operational appointment WhatsApp notifications',
    })
    notifyWhatsapp: boolean;

    @IsBoolean()
    @ApiProperty({
        description: 'Operational appointment email notifications',
    })
    notifyEmail: boolean;

    @IsBoolean()
    @ApiProperty({ description: 'SMS marketing consent' })
    smsConsent: boolean;

    @IsBoolean()
    @ApiProperty({ description: 'WhatsApp marketing consent' })
    whatsappConsent: boolean;

    @IsBoolean()
    @ApiProperty({ description: 'Email marketing consent' })
    emailConsent: boolean;
}
