import { ApiProperty } from '@nestjs/swagger';
import {
    IsEnum,
    IsNumber,
    IsOptional,
    IsArray,
    ValidateNested,
    Min,
    IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../appointment.entity';

export class ProductSaleItemDto {
    @ApiProperty({ description: 'Product ID' })
    @IsNumber()
    productId: number;

    @ApiProperty({ description: 'Quantity sold', minimum: 1 })
    @IsNumber()
    @Min(1)
    quantity: number;

    @ApiProperty({ description: 'Unit price in cents (optional, uses product price if not specified)', required: false })
    @IsNumber()
    @IsOptional()
    unitPriceCents?: number;

    @ApiProperty({ description: 'Discount in cents for this item', required: false })
    @IsNumber()
    @IsOptional()
    discountCents?: number;
}

export class FinalizeAppointmentDto {
    @ApiProperty({
        description: 'Payment method used',
        enum: PaymentMethod,
        example: PaymentMethod.Card,
    })
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @ApiProperty({
        description: 'Amount paid in cents',
        example: 15000,
    })
    @IsNumber()
    @Min(0)
    paidAmountCents: number;

    @ApiProperty({
        description: 'Tip amount in cents',
        required: false,
        example: 500,
    })
    @IsNumber()
    @IsOptional()
    @Min(0)
    tipAmountCents?: number;

    @ApiProperty({
        description: 'Discount amount in cents',
        required: false,
        example: 1000,
    })
    @IsNumber()
    @IsOptional()
    @Min(0)
    discountCents?: number;

    @ApiProperty({
        description: 'Products sold during the visit (upselling)',
        required: false,
        type: [ProductSaleItemDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductSaleItemDto)
    @IsOptional()
    products?: ProductSaleItemDto[];

    @ApiProperty({
        description: 'Internal note about the finalization',
        required: false,
    })
    @IsString()
    @IsOptional()
    note?: string;
}
