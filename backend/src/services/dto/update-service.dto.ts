import { IsInt, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class UpdateServiceDto {
    @IsOptional()
    @IsString()
    @Length(2, 80)
    name?: string;

    @IsOptional()
    @IsString()
    description?: string | null;

    @IsOptional()
    @IsInt()
    @Min(10)
    @Max(480)
    duration?: number;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(1)
    @Max(10000)
    price?: number;

    @IsOptional()
    @IsNumber()
    defaultCommissionPercent?: number | null;

    @IsOptional()
    @IsInt()
    categoryId?: number | null;
}
