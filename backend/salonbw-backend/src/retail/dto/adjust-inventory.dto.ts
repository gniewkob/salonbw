import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsNotEmpty,
    IsInt,
} from 'class-validator';

export class AdjustInventoryDto {
    @ApiProperty({ description: 'ID of the product to adjust' })
    @IsInt()
    @IsNotEmpty()
    productId: number;

    @ApiProperty({ description: 'Change in quantity (positive or negative)' })
    @IsInt()
    @IsNotEmpty()
    delta: number;

    @ApiProperty({ description: 'Reason for the adjustment' })
    @IsString()
    @IsNotEmpty()
    reason: string;

    @ApiProperty({ description: 'Optional note', required: false })
    @IsString()
    @IsOptional()
    note?: string;
}
