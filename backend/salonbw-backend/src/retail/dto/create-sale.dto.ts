import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsString,
    IsNumber,
    IsOptional,
    IsInt,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSaleItemDto {
    @ApiProperty({ description: 'The ID of the product being sold' })
    @IsInt()
    productId: number;

    @ApiProperty({ description: 'Quantity of items sold', minimum: 1 })
    @IsInt()
    @Min(1)
    quantity: number;

    @ApiProperty({
        description: 'Unit price in cents (preferred over unitPrice)',
        required: false,
    })
    @IsNumber()
    @IsOptional()
    unitPriceCents?: number;

    @ApiProperty({
        description: 'Total discount in cents for this line',
        required: false,
    })
    @IsNumber()
    @IsOptional()
    discountCents?: number;

    @ApiProperty({
        description:
            'Unit price in standard currency units (deprecated, use unitPriceCents)',
        required: false,
    })
    @IsNumber()
    @IsOptional()
    unitPrice?: number;

    @ApiProperty({
        description:
            'Line discount in standard currency units (deprecated, use discountCents)',
        required: false,
    })
    @IsNumber()
    @IsOptional()
    discount?: number;

    @ApiProperty({ description: 'Product unit label', required: false })
    @IsString()
    @IsOptional()
    unit?: string;
}

export class CreateSaleDto {
    @ApiProperty({
        description:
            'The ID of the product being sold (legacy single-item payload)',
        required: false,
    })
    @IsNumber()
    @IsOptional()
    productId: number;

    @ApiProperty({
        description: 'Quantity of items sold (legacy single-item payload)',
        minimum: 1,
        required: false,
    })
    @IsNumber()
    @Min(1)
    @IsOptional()
    quantity: number;

    @ApiProperty({ description: 'Unit price in cents (preferred over unitPrice)', required: false })
    @IsNumber()
    @IsOptional()
    unitPriceCents?: number;

    @ApiProperty({ description: 'Total discount in cents (preferred over discount)', required: false })
    @IsNumber()
    @IsOptional()
    discountCents?: number;

    @ApiProperty({ description: 'Unit price in standard currency units (deprecated, use unitPriceCents)', required: false })
    @IsNumber()
    @IsOptional()
    unitPrice?: number;

    @ApiProperty({ description: 'Discount in standard currency units (deprecated, use discountCents)', required: false })
    @IsNumber()
    @IsOptional()
    discount?: number;

    @ApiProperty({ description: 'ID of the employee credited with the sale', required: false })
    @IsNumber()
    @IsOptional()
    employeeId?: number;

    @ApiProperty({ description: 'ID of the associated appointment', required: false })
    @IsNumber()
    @IsOptional()
    appointmentId?: number;

    @ApiProperty({ description: 'Optional note for the sale', required: false })
    @IsString()
    @IsOptional()
    note?: string;

    @ApiProperty({
        description: 'Optional sale date (ISO string)',
        required: false,
    })
    @IsString()
    @IsOptional()
    soldAt?: string;

    @ApiProperty({
        description: 'Optional client display name',
        required: false,
    })
    @IsString()
    @IsOptional()
    clientName?: string;

    @ApiProperty({
        description: 'Optional payment method',
        required: false,
    })
    @IsString()
    @IsOptional()
    paymentMethod?: string;

    @ApiProperty({
        description: 'Sale items (preferred over legacy single-item payload)',
        type: [CreateSaleItemDto],
        required: false,
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSaleItemDto)
    @IsOptional()
    items?: CreateSaleItemDto[];
}
