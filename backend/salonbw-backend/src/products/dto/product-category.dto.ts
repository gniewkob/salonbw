import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    Min,
} from 'class-validator';

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
