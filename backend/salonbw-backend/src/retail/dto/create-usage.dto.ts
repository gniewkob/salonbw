import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsDateString,
    IsInt,
    IsIn,
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

    @ApiPropertyOptional({
        enum: ['planned', 'completed'],
        default: 'completed',
    })
    @IsOptional()
    @IsIn(['planned', 'completed'])
    scope?: 'planned' | 'completed';

    @ApiPropertyOptional({
        description:
            'Planned usage date (used when scope=planned). ISO 8601 datetime.',
    })
    @IsOptional()
    @IsDateString()
    plannedFor?: string;
}
