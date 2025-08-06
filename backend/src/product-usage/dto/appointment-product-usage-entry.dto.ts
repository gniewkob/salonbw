import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Min } from 'class-validator';
import { UsageType } from '../usage-type.enum';

const allowedUsageTypes = [UsageType.INTERNAL, UsageType.STOCK_CORRECTION] as const;
export type AppointmentUsageType = (typeof allowedUsageTypes)[number];

export class AppointmentProductUsageEntryDto {
    @ApiProperty({
        description: 'Identifier of the product used',
        type: Number,
        example: 1,
    })
    @IsInt()
    productId: number;

    @ApiProperty({
        description: 'Quantity of product used',
        type: Number,
        minimum: 1,
        example: 2,
    })
    @IsInt()
    @Min(1)
    quantity: number;

    @IsEnum(allowedUsageTypes)
    @ApiProperty({
        enum: allowedUsageTypes,
        required: false,
        description: 'Usage classification. Allowed values: INTERNAL or STOCK_CORRECTION. Defaults to INTERNAL when omitted.',
        example: UsageType.INTERNAL,
    })
    usageType?: AppointmentUsageType;
}

export { allowedUsageTypes as appointmentUsageTypes };
