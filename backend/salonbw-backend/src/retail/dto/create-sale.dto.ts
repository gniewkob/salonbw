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

    @ApiPropertyOptional({ description: 'Absolute discount amount' })
    @IsOptional()
    @IsNumber()
    discount?: number;

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
