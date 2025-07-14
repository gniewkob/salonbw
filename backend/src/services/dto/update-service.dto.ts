import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateServiceDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string | null;

    @IsOptional()
    @IsInt()
    duration?: number;

    @IsOptional()
    @IsNumber()
    price?: number;

    @IsOptional()
    @IsNumber()
    defaultCommissionPercent?: number | null;

    @IsOptional()
    @IsInt()
    categoryId?: number | null;
}
