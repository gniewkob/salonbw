import { PartialType, OmitType } from '@nestjs/mapped-types';
import {
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    Length,
} from 'class-validator';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(
    OmitType(CreateProductDto, ['brand'] as const),
) {
    @IsOptional()
    @IsString()
    @Length(2, 80)
    name?: string;

    @IsOptional()
    @IsString()
    brand?: string | null;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(1.01)
    unitPrice?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    stock?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    lowStockThreshold?: number;
}
