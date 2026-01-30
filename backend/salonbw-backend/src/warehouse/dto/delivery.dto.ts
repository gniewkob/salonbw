import {
    IsString,
    IsOptional,
    IsNumber,
    IsArray,
    IsDateString,
    ValidateNested,
    IsEnum,
    Min,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryStatus } from '../entities/delivery.entity';

export class DeliveryItemDto {
    @ApiProperty()
    @IsNumber()
    productId: number;

    @ApiProperty()
    @IsNumber()
    @Min(1)
    quantity: number;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    unitCost: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(50)
    batchNumber?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    expiryDate?: string;
}

export class CreateDeliveryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    supplierId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    deliveryDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    invoiceNumber?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ type: [DeliveryItemDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DeliveryItemDto)
    items?: DeliveryItemDto[];
}

export class UpdateDeliveryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    supplierId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    deliveryDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    invoiceNumber?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ enum: DeliveryStatus })
    @IsOptional()
    @IsEnum(DeliveryStatus)
    status?: DeliveryStatus;
}

export class AddDeliveryItemDto extends DeliveryItemDto {}

export class UpdateDeliveryItemDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(1)
    quantity?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    unitCost?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(50)
    batchNumber?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    expiryDate?: string;
}

export class ReceiveDeliveryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}
