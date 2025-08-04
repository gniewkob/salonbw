import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Min } from 'class-validator';
import { UsageType } from '../usage-type.enum';

export class ProductUsageEntryDto {
    @ApiProperty()
    @IsInt()
    @Min(1)
    productId: number;

    @ApiProperty({ minimum: 1 })
    @IsInt()
    @Min(1)
    quantity: number;

    @IsEnum(UsageType)
    @ApiProperty({
        enum: UsageType,
        required: false,
        description: 'Usage classification. Defaults to INTERNAL when omitted.',
    })
    usageType?: UsageType;
}
