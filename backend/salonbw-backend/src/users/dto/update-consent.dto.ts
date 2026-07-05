import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateConsentDto {
    @IsBoolean()
    @IsOptional()
    @ApiProperty({ required: false })
    notifyPanel?: boolean;

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
