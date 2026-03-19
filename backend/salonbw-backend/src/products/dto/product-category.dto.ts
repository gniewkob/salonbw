import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsInt,
    IsArray,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductCategoryDto {
    @ApiProperty()
    @IsString()
    @MaxLength(120)
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(1)
    parentId?: number;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsInt()
    sortOrder?: number;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateProductCategoryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(120)
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(1)
    parentId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    sortOrder?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class ReorderProductCategoryItemDto {
    @ApiProperty()
    @IsInt()
    @Min(1)
    id: number;

    @ApiPropertyOptional({ nullable: true })
    @IsOptional()
    @IsInt()
    @Min(1)
    parentId?: number | null;

    @ApiProperty()
    @IsInt()
    @Min(0)
    sortOrder: number;
}

export class ReorderProductCategoriesDto {
    @ApiProperty({ type: [ReorderProductCategoryItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReorderProductCategoryItemDto)
    items: ReorderProductCategoryItemDto[];
}
