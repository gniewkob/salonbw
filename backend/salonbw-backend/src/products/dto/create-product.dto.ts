import { IsString, IsPositive, IsInt, Min } from 'class-validator';

export class CreateProductDto {
    @IsString()
    name: string;

    @IsString()
    brand: string;

    @IsPositive()
    unitPrice: number;

    @IsInt()
    @Min(0)
    stock: number;
}
