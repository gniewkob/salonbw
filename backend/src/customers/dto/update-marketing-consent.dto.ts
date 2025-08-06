import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateMarketingConsentDto {
    @ApiProperty({
        description: 'Indicates if the customer consents to receive marketing communications',
        type: Boolean,
        example: true,
    })
    @IsBoolean()
    marketingConsent: boolean;
}
