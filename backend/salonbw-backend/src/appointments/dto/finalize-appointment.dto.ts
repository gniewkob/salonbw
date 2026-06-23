import { ApiProperty } from '@nestjs/swagger';
import {
    IsEnum,
    IsNumber,
    IsOptional,
    IsArray,
    ValidateNested,
    Min,
    IsString,
    IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../appointment.entity';

export class UsageItemDto {
    @ApiProperty({ description: 'Product ID' })
    @IsNumber()
    productId: number;

    @ApiProperty({ description: 'Quantity used', minimum: 1 })
    @IsNumber()
    @Min(1)
    quantity: number;

    @ApiProperty({ description: 'Unit (e.g. ml, g, op.)', required: false })
    @IsString()
    @IsOptional()
    unit?: string;
}

export class ProductSaleItemDto {
    @ApiProperty({ description: 'Product ID' })
    @IsNumber()
    productId: number;

    @ApiProperty({ description: 'Quantity sold', minimum: 1 })
    @IsNumber()
    @Min(1)
    quantity: number;

    @ApiProperty({
        description:
            'Unit price in cents (optional, uses product price if not specified)',
        required: false,
    })
    @IsNumber()
    @IsOptional()
    unitPriceCents?: number;

    @ApiProperty({
        description: 'Discount in cents for this item',
        required: false,
    })
    @IsNumber()
    @IsOptional()
    discountCents?: number;
}

export class UsageMaterialItemDto {
    @ApiProperty({ description: 'Product ID' })
    @IsInt()
    productId: number;

    @ApiProperty({
        description: 'Quantity used (will be rounded to integer)',
        minimum: 1,
    })
    @IsNumber()
    @Min(1)
    quantity: number;

    @ApiProperty({ description: 'Unit', required: false })
    @IsString()
    @IsOptional()
    unit?: string;
}

export class AdditionalServiceDto {
    @ApiProperty({ description: 'Service ID from the catalog' })
    @IsInt()
    serviceId: number;

    @ApiProperty({
        description:
            'Price in cents (optional — defaults to the catalog price)',
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @Min(0)
    priceCents?: number;

    @ApiProperty({
        description: 'Per-item discount in cents',
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @Min(0)
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
        description:
            'Service price in cents (staff override of the price-list value). ' +
            'When provided it becomes the commission base for the primary service.',
        required: false,
        example: 12000,
    })
    @IsNumber()
    @IsOptional()
    @Min(0)
    servicePriceCents?: number;

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
        description:
            'Materials used during the treatment (deducted from warehouse)',
        required: false,
        type: [UsageMaterialItemDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UsageMaterialItemDto)
    @IsOptional()
    usageMaterials?: UsageMaterialItemDto[];

    @ApiProperty({
        description: 'Internal note about the finalization',
        required: false,
    })
    @IsString()
    @IsOptional()
    note?: string;

    @ApiProperty({
        description:
            'Materials used during the service (deducted from warehouse)',
        required: false,
        type: [UsageItemDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UsageItemDto)
    @IsOptional()
    usageItems?: UsageItemDto[];

    @ApiProperty({
        description:
            'Client-visible recommendations shown to the client under the completed visit (appended to appointment.notes).',
        required: false,
    })
    @IsString()
    @IsOptional()
    clientNote?: string;

    @ApiProperty({
        description:
            'Extra services added during the visit (line-items beyond the primary service); each contributes to the total and the combined commission.',
        required: false,
        type: [AdditionalServiceDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AdditionalServiceDto)
    @IsOptional()
    additionalServices?: AdditionalServiceDto[];
}
