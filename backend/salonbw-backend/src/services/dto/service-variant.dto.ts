import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
    IsString,
    IsNumber,
    IsBoolean,
    IsOptional,
    IsNotEmpty,
    IsEnum,
    MaxLength,
    Min,
} from 'class-validator';
import { PriceType } from '../entities/service-variant.entity';

export class CreateServiceVariantDto {
    @ApiProperty({ description: 'Variant name (e.g., "Krótkie włosy", "Długie włosy")' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @ApiProperty({ required: false, description: 'Variant description' })
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

    @ApiProperty({ required: false, default: 0, description: 'Sort order' })
    @IsNumber()
    @IsOptional()
    sortOrder?: number;

    @ApiProperty({ required: false, default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateServiceVariantDto extends PartialType(CreateServiceVariantDto) {}

export class ReorderVariantsDto {
    @ApiProperty({
        description: 'Array of variant IDs in new order',
        type: [Number],
    })
    @IsNumber({}, { each: true })
    variantIds: number[];
}
