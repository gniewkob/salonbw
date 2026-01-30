import {
    IsString,
    IsOptional,
    IsNumber,
    IsArray,
    IsDateString,
    ValidateNested,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StocktakingItemDto {
    @ApiProperty()
    @IsNumber()
    productId: number;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    countedQuantity: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}

export class CreateStocktakingDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    stocktakingDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateStocktakingDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    stocktakingDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}

export class AddStocktakingItemsDto {
    @ApiProperty({ type: [StocktakingItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => StocktakingItemDto)
    items: StocktakingItemDto[];
}

export class UpdateStocktakingItemDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    countedQuantity?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}

export class CompleteStocktakingDto {
    @ApiPropertyOptional({ default: true })
    @IsOptional()
    applyDifferences?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}
