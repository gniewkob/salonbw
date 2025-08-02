import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkStockEntryDto {
    @ApiProperty()
    @IsInt()
    id: number;

    @ApiProperty({ minimum: 0 })
    @IsInt()
    @Min(0)
    stock: number;
}

export class BulkUpdateStockDto {
    @ApiProperty({ type: [BulkStockEntryDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkStockEntryDto)
    entries: BulkStockEntryDto[];
}
