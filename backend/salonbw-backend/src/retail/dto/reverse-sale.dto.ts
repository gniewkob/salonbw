import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsInt,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReverseSaleItemDto {
    @ApiPropertyOptional({ minimum: 1 })
    @IsInt()
    @Min(1)
    saleItemId: number;

    @ApiPropertyOptional({ minimum: 1 })
    @IsInt()
    @Min(1)
    quantity: number;
}

export class ReverseSaleDto {
    @ApiPropertyOptional({ type: [ReverseSaleItemDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReverseSaleItemDto)
    items?: ReverseSaleItemDto[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    reason?: string;

    @ApiPropertyOptional({
        description: 'Transaction date for the reversal entry',
    })
    @IsOptional()
    @IsDateString()
    soldAt?: string;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    restock?: boolean;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    reverseCommission?: boolean;
}
