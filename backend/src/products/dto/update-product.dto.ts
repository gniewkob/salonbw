import { PartialType, OmitType } from '@nestjs/mapped-types';
import {
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    Length,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(
    OmitType(CreateProductDto, ['brand'] as const),
) {
    @ApiPropertyOptional({
        description: 'Updated product name',
        type: String,
        example: 'Conditioner',
    })
    @IsOptional()
    @IsString()
    @Length(2, 80)
    name?: string;

    @ApiPropertyOptional({
        description: 'Updated product brand',
        type: String,
        example: 'Acme',
        nullable: true,
    })
    @IsOptional()
    @IsString()
    brand?: string | null;

    @ApiPropertyOptional({
        description: 'Updated unit price',
        type: Number,
        minimum: 1.01,
        example: 15.99,
    })
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(1.01)
    unitPrice?: number;

    @ApiPropertyOptional({
        description: 'Updated stock level',
        type: Number,
        minimum: 0,
        example: 50,
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    stock?: number;

    @ApiPropertyOptional({
        description: 'Updated low stock threshold',
        type: Number,
        minimum: 0,
        example: 10,
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    lowStockThreshold?: number;
}
