import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkStockEntryDto {
    @ApiProperty({
        description: 'Product identifier',
        type: Number,
        example: 1,
    })
    @IsInt()
    id: number;

    @ApiProperty({
        minimum: 0,
        description:
            'New stock level. Adjustments are logged with usageType STOCK_CORRECTION.',
        type: Number,
        example: 20,
    })
    @IsInt()
    @Min(0)
    stock: number;
}

export class BulkUpdateStockDto {
    @ApiProperty({
        type: [BulkStockEntryDto],
        description:
            'Array of stock updates. Each change is logged with usageType STOCK_CORRECTION.',
        example: [{ id: 1, stock: 20 }],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkStockEntryDto)
    entries: BulkStockEntryDto[];
}
