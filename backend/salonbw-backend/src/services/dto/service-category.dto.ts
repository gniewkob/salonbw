import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
    IsString,
    IsNumber,
    IsBoolean,
    IsOptional,
    IsNotEmpty,
    MaxLength,
} from 'class-validator';

export class CreateServiceCategoryDto {
    @ApiProperty({ description: 'Category name' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @ApiProperty({ required: false, description: 'Category description' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ required: false, description: 'Color hex code (e.g., #25B4C1)' })
    @IsString()
    @IsOptional()
    @MaxLength(7)
    color?: string;

    @ApiProperty({ required: false, description: 'Parent category ID for hierarchy' })
    @IsNumber()
    @IsOptional()
    parentId?: number;

    @ApiProperty({ required: false, default: 0, description: 'Sort order' })
    @IsNumber()
    @IsOptional()
    sortOrder?: number;

    @ApiProperty({ required: false, default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateServiceCategoryDto extends PartialType(CreateServiceCategoryDto) {}

export class ReorderCategoriesDto {
    @ApiProperty({
        description: 'Array of category IDs in new order',
        type: [Number],
    })
    @IsNumber({}, { each: true })
    categoryIds: number[];
}
