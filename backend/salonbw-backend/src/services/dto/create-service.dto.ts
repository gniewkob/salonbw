import { IsString, IsOptional, IsPositive, IsInt, Min, Max } from 'class-validator';

export class CreateServiceDto {
    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsInt()
    @Min(1)
    duration: number;

    @IsPositive()
    price: number;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @Min(0)
    @Max(100)
    commissionPercent?: number;
}
