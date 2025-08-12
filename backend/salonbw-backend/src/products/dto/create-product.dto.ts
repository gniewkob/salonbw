import { IsString, IsPositive } from 'class-validator';

export class CreateProductDto {
    @IsString()
    name: string;

    @IsString()
    brand: string;

    @IsPositive()
    unitPrice: number;

    @IsPositive()
    stock: number;
}
