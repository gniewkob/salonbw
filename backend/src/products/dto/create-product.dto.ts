import { IsString, IsNumber, IsInt, IsOptional } from 'class-validator';

export class CreateProductDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    brand?: string;

    @IsNumber()
    unitPrice: number;

    @IsInt()
    stock: number;
}
