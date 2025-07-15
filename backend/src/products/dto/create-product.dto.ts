import { IsString, IsNumber, IsInt, IsOptional, Min } from 'class-validator';

export class CreateProductDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    brand?: string;

    @IsNumber()
    @Min(0)
    unitPrice: number;

    @IsInt()
    @Min(0)
    stock: number;
}
