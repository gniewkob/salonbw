import { IsInt, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateServiceDto {
    @IsString()
    @Length(2, 80)
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsInt()
    @Min(10)
    @Max(480)
    duration: number;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(1)
    @Max(10000)
    price: number;

    @IsOptional()
    @IsNumber()
    defaultCommissionPercent?: number | null;

    @IsInt()
    categoryId: number;
}
