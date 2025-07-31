import {
    IsString,
    IsNumber,
    IsInt,
    IsOptional,
    Min,
    Length,
} from 'class-validator';

export class CreateProductDto {
    @IsString()
    @Length(2, 80)
    name: string;

    @IsOptional()
    @IsString()
    brand?: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(1.01)
    unitPrice: number;

    @IsInt()
    @Min(0)
    stock: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    lowStockThreshold = 5;
}
