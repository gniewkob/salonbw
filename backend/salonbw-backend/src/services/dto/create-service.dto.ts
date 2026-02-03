import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNumber,
    IsBoolean,
    IsOptional,
    IsNotEmpty,
    IsEnum,
    Min,
    Max,
} from 'class-validator';
import { PriceType } from '../service.entity';

export class CreateServiceDto {
    @ApiProperty({ description: 'Service name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ required: false, description: 'Service description' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'Duration in minutes' })
    @IsNumber()
    @Min(5)
    duration: number;

    @ApiProperty({ description: 'Price in PLN' })
    @IsNumber()
    @Min(0)
    price: number;

    @ApiProperty({
        enum: PriceType,
        default: PriceType.Fixed,
        description: 'Price type: fixed or from (minimum)',
    })
    @IsEnum(PriceType)
    @IsOptional()
    priceType?: PriceType;

    @ApiProperty({ required: false, description: 'VAT rate (%)' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    vatRate?: number;

    @ApiProperty({ required: false, default: false })
    @IsBoolean()
    @IsOptional()
    isFeatured?: boolean;

    @ApiProperty({ required: false, description: 'Public description' })
    @IsString()
    @IsOptional()
    publicDescription?: string;

    @ApiProperty({ required: false, description: 'Private description' })
    @IsString()
    @IsOptional()
    privateDescription?: string;

    @ApiProperty({ required: false, description: 'Legacy string category (deprecated)' })
    @IsString()
    @IsOptional()
    category?: string;

    @ApiProperty({ required: false, description: 'Category ID (new hierarchical system)' })
    @IsNumber()
    @IsOptional()
    categoryId?: number;

    @ApiProperty({ required: false, description: 'Commission percentage (0-100)' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    commissionPercent?: number;

    @ApiProperty({ required: false, default: true, description: 'Is service active' })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({ required: false, default: true, description: 'Available for online booking' })
    @IsBoolean()
    @IsOptional()
    onlineBooking?: boolean;

    @ApiProperty({ required: false, default: 0, description: 'Sort order' })
    @IsNumber()
    @IsOptional()
    sortOrder?: number;
}
