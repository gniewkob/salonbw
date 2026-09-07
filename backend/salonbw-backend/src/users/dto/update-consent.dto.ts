import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateConsentDto {
    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Master switch for operational appointment notifications',
        required: false,
    })
    receiveNotifications?: boolean;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({ required: false })
    notifyPanel?: boolean;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Receive operational appointment notifications by SMS',
        required: false,
    })
    notifySms?: boolean;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description:
            'Receive operational appointment notifications by WhatsApp',
        required: false,
    })
    notifyWhatsapp?: boolean;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Receive operational appointment notifications by email',
        required: false,
    })
    notifyEmail?: boolean;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({ required: false })
    smsConsent?: boolean;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({ required: false })
    whatsappConsent?: boolean;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({ required: false })
    emailConsent?: boolean;
}
