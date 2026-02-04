import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNumber,
    IsOptional,
    IsBoolean,
    IsInt,
    IsEnum,
    Min,
    Max,
} from 'class-validator';
import { ProductType } from '../product.entity';

export class UpdateProductDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    brand?: string;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    unitPrice?: number;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    vatRate?: number;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    stock?: number;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    purchasePrice?: number;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    sku?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    barcode?: string;

    @ApiProperty({ required: false, enum: ProductType })
    @IsEnum(ProductType)
    @IsOptional()
    productType?: ProductType;

    @ApiProperty({ required: false })
    @IsInt()
    @IsOptional()
    minQuantity?: number;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    unit?: string;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    packageSize?: number;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    packageUnit?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    manufacturer?: string;

    @ApiProperty({ required: false })
    @IsInt()
    @IsOptional()
    defaultSupplierId?: number;

    @ApiProperty({ required: false })
    @IsInt()
    @IsOptional()
    categoryId?: number;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    trackStock?: boolean;
}
