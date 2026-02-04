import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsInt,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WarehouseOrderItemDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    productId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    productName?: string;

    @ApiProperty({ minimum: 1 })
    @IsInt()
    @Min(1)
    quantity: number;

    @ApiPropertyOptional({ default: 'op.' })
    @IsOptional()
    @IsString()
    unit?: string;
}

export class CreateWarehouseOrderDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    supplierId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({ type: [WarehouseOrderItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WarehouseOrderItemDto)
    items: WarehouseOrderItemDto[];
}

export class UpdateWarehouseOrderDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    supplierId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ type: [WarehouseOrderItemDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WarehouseOrderItemDto)
    items?: WarehouseOrderItemDto[];
}

export class ReceiveWarehouseOrderDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}
