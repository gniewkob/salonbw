import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Min } from 'class-validator';
import { UsageType } from '../usage-type.enum';

export class ProductUsageEntryDto {
    @ApiProperty({
        description: 'Identifier of the product used',
        type: Number,
        minimum: 1,
        example: 1,
    })
    @IsInt()
    @Min(1)
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

    @IsEnum(UsageType)
    @ApiProperty({
        enum: UsageType,
        required: false,
        description: 'Usage classification. Defaults to INTERNAL when omitted.',
        example: UsageType.INTERNAL,
    })
    usageType?: UsageType;
}
