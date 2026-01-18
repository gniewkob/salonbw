import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNumber,
    IsOptional,
    IsNotEmpty,
    Min,
} from 'class-validator';

export class CreateSaleDto {
    @ApiProperty({ description: 'The ID of the product being sold' })
    @IsNumber()
    @IsNotEmpty()
    productId: number;

    @ApiProperty({ description: 'Quantity of items sold', minimum: 1 })
    @IsNumber()
    @Min(1)
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
}
