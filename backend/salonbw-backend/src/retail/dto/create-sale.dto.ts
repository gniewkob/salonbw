import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsInt,
    Min,
    IsOptional,
    IsNumber,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateSaleDto {
    @ApiProperty()
    @IsInt()
    productId!: number;

    @ApiProperty({ minimum: 1 })
    @IsInt()
    @Min(1)
    quantity!: number;

    @ApiPropertyOptional({ description: 'Override default unit price' })
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    unitPrice?: number;

    @ApiPropertyOptional({
        description:
            'Override default unit price in cents (preferred). If provided, takes precedence over unitPrice.',
        example: 1999,
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    unitPriceCents?: number;

    @ApiPropertyOptional({ description: 'Absolute discount amount' })
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    discount?: number;

    @ApiPropertyOptional({
        description:
            'Absolute discount in cents (preferred). If provided, takes precedence over discount.',
        example: 200,
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    discountCents?: number;

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
    @MaxLength(500)
    note?: string;
}
