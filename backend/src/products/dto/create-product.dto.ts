import {
    IsString,
    IsNumber,
    IsInt,
    IsOptional,
    Min,
    Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
    @ApiProperty({
        description: 'Product name',
        type: String,
        minLength: 2,
        maxLength: 80,
        example: 'Shampoo',
    })
    @IsString()
    @Length(2, 80)
    name: string;

    @ApiPropertyOptional({
        description: 'Product brand',
        type: String,
        example: 'Acme',
    })
    @IsOptional()
    @IsString()
    brand?: string;

    @ApiProperty({
        description: 'Price per unit',
        type: Number,
        minimum: 1.01,
        example: 19.99,
    })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(1.01)
    unitPrice: number;

    @ApiProperty({
        description: 'Number of items currently in stock',
        type: Number,
        minimum: 0,
        example: 100,
    })
    @IsInt()
    @Min(0)
    stock: number;

    @ApiPropertyOptional({
        description: 'Threshold below which stock is considered low',
        type: Number,
        minimum: 0,
        example: 5,
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    lowStockThreshold = 5;
}
