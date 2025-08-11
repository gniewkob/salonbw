import { IsString, IsOptional, IsPositive } from 'class-validator';

export class CreateServiceDto {
    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsPositive()
    duration: number;

    @IsPositive()
    price: number;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsPositive()
    commissionPercent?: number;
}
