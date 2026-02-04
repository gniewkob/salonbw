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

export class CreateUsageItemDto {
    @ApiProperty()
    @IsInt()
    productId: number;

    @ApiProperty({ minimum: 1 })
    @IsInt()
    @Min(1)
    quantity: number;

    @ApiPropertyOptional({ default: 'op.' })
    @IsOptional()
    @IsString()
    unit?: string;
}

export class CreateUsageDto {
    @ApiProperty({ type: [CreateUsageItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateUsageItemDto)
    items: CreateUsageItemDto[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    employeeId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    appointmentId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    clientName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    note?: string;
}
