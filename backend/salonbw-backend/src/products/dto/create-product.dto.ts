import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNumber,
    IsOptional,
    IsNotEmpty,
    IsBoolean,
    IsInt,
    IsEnum,
    Min,
    Max,
} from 'class-validator';
import { ProductType } from '../product.entity';

export class CreateProductDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    brand?: string;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    unitPrice: number;

    @ApiProperty({ required: false, default: 23 })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    vatRate?: number;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    stock: number;

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

    @ApiProperty({ required: false, default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({ required: false, default: true })
    @IsBoolean()
    @IsOptional()
    trackStock?: boolean;
}
