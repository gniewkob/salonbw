import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ProductType } from '../product.entity';

export class QueryProductsDto {
    @ApiPropertyOptional({ description: 'Search by name, SKU, barcode, brand' })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional()
    @Transform(({ value }) => (value ? Number(value) : undefined))
    @IsInt()
    @Min(1)
    @IsOptional()
    categoryId?: number;

    @ApiPropertyOptional({ enum: ProductType })
    @IsEnum(ProductType)
    @IsOptional()
    productType?: ProductType;

    @ApiPropertyOptional({ default: false })
    @Transform(({ value }) => value === 'true' || value === true)
    @IsOptional()
    includeInactive?: boolean;

    @ApiPropertyOptional({ enum: ['name', 'stock', 'unitPrice', 'createdAt', 'updatedAt'] })
    @IsOptional()
    @IsString()
    sortBy?: 'name' | 'stock' | 'unitPrice' | 'createdAt' | 'updatedAt';

    @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
    @IsOptional()
    @IsString()
    sortOrder?: 'ASC' | 'DESC';
}
