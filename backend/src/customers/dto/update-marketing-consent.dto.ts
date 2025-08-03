import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateMarketingConsentDto {
    @ApiProperty()
    @IsBoolean()
    marketingConsent: boolean;
}
