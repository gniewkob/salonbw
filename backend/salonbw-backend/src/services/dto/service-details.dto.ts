import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceReviewSource } from '../entities/service-review.entity';

export class ServiceStatsQueryDto {
    @ApiPropertyOptional({ description: 'ISO date (YYYY-MM-DD)' })
    @IsOptional()
    @IsString()
    from?: string;

    @ApiPropertyOptional({ description: 'ISO date (YYYY-MM-DD)' })
    @IsOptional()
    @IsString()
    to?: string;

    @ApiPropertyOptional({ description: 'day|week|month' })
    @IsOptional()
    @IsString()
    groupBy?: string;
}

export class ServiceHistoryQueryDto {
    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    page?: number;

    @ApiPropertyOptional({ default: 20 })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    limit?: number;

    @ApiPropertyOptional({ description: 'ISO date (YYYY-MM-DD)' })
    @IsOptional()
    @IsString()
    from?: string;

    @ApiPropertyOptional({ description: 'ISO date (YYYY-MM-DD)' })
    @IsOptional()
    @IsString()
    to?: string;
}

export class CreateServiceReviewDto {
    @ApiPropertyOptional({ enum: ServiceReviewSource })
    @IsOptional()
    @IsEnum(ServiceReviewSource)
    source?: ServiceReviewSource;

    @ApiProperty({ minimum: 1, maximum: 5 })
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    comment?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    authorName?: string;
}

export class CreateServiceMediaDto {
    @ApiProperty()
    @IsUrl()
    url: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    caption?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    sortOrder?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isPublic?: boolean;
}

export class ServiceRecipeItemDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    serviceVariantId?: number | null;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    productId?: number | null;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    quantity?: number | null;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    unit?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string | null;
}

export class UpdateServiceRecipeDto {
    @ApiProperty({ type: [ServiceRecipeItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ServiceRecipeItemDto)
    items: ServiceRecipeItemDto[];
}

export class CommissionRuleItemDto {
    @ApiProperty()
    @IsInt()
    @Type(() => Number)
    employeeId: number;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    @Max(100)
    @Type(() => Number)
    commissionPercent: number;
}

export class UpdateServiceCommissionsDto {
    @ApiProperty({ type: [CommissionRuleItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CommissionRuleItemDto)
    rules: CommissionRuleItemDto[];
}
