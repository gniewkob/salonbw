import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, IsOptional, IsNumber, IsString } from 'class-validator';

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
    @IsNumber()
    unitPrice?: number;

    @ApiPropertyOptional({
        description:
            'Override default unit price in cents (preferred). If provided, takes precedence over unitPrice.',
        example: 1999,
    })
    @IsOptional()
    @IsInt()
    unitPriceCents?: number;

    @ApiPropertyOptional({ description: 'Absolute discount amount' })
    @IsOptional()
    @IsNumber()
    discount?: number;

    @ApiPropertyOptional({
        description:
            'Absolute discount in cents (preferred). If provided, takes precedence over discount.',
        example: 200,
    })
    @IsOptional()
    @IsInt()
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
    note?: string;
}
