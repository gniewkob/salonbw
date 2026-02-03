import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNumber,
    IsBoolean,
    IsOptional,
    IsEnum,
    Min,
    Max,
} from 'class-validator';
import { PriceType } from '../service.entity';

export class UpdateServiceDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    duration?: number;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    price?: number;

    @ApiProperty({ required: false, enum: PriceType })
    @IsEnum(PriceType)
    @IsOptional()
    priceType?: PriceType;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    category?: string;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    categoryId?: number;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    commissionPercent?: number;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    onlineBooking?: boolean;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    sortOrder?: number;

    @ApiProperty({ required: false, description: 'VAT rate (%)' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    vatRate?: number;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isFeatured?: boolean;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    publicDescription?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    privateDescription?: string;
}
