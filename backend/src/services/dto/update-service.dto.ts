import { IsInt, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateServiceDto {
    @ApiPropertyOptional({
        description: 'Updated service name',
        type: String,
        example: 'Deluxe Haircut',
    })
    @IsOptional()
    @IsString()
    @Length(2, 80)
    name?: string;

    @ApiPropertyOptional({
        description: 'Updated service description',
        type: String,
        example: 'Includes wash, cut and style',
        nullable: true,
    })
    @IsOptional()
    @IsString()
    description?: string | null;

    @ApiPropertyOptional({
        description: 'Updated duration in minutes',
        type: Number,
        minimum: 10,
        maximum: 480,
        example: 90,
    })
    @IsOptional()
    @IsInt()
    @Min(10)
    @Max(480)
    duration?: number;

    @ApiPropertyOptional({
        description: 'Updated service price',
        type: Number,
        minimum: 1,
        maximum: 10000,
        example: 59.99,
    })
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(1)
    @Max(10000)
    price?: number;

    @ApiPropertyOptional({
        description: 'Updated default commission percentage',
        type: Number,
        example: 12,
        nullable: true,
    })
    @IsOptional()
    @IsNumber()
    defaultCommissionPercent?: number | null;

    @ApiPropertyOptional({
        description: 'Updated category identifier',
        type: Number,
        example: 2,
        nullable: true,
    })
    @IsOptional()
    @IsInt()
    categoryId?: number | null;
}
