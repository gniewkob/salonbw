import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Min } from 'class-validator';
import { UsageType } from '../usage-type.enum';

const allowedUsageTypes = [UsageType.INTERNAL, UsageType.STOCK_CORRECTION] as const;
export type AppointmentUsageType = (typeof allowedUsageTypes)[number];

export class AppointmentProductUsageEntryDto {
    @ApiProperty()
    @IsInt()
    productId: number;

    @ApiProperty({ minimum: 1 })
    @IsInt()
    @Min(1)
    quantity: number;

    @IsEnum(allowedUsageTypes)
    @ApiProperty({
        enum: allowedUsageTypes,
        required: false,
        description: 'Usage classification. Allowed values: INTERNAL or STOCK_CORRECTION. Defaults to INTERNAL when omitted.',
    })
    usageType?: AppointmentUsageType;
}

export { allowedUsageTypes as appointmentUsageTypes };
