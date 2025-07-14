import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateServiceDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsInt()
    duration: number;

    @IsNumber()
    price: number;

    @IsOptional()
    @IsNumber()
    defaultCommissionPercent?: number | null;

    @IsOptional()
    @IsInt()
    categoryId?: number | null;
}
