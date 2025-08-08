import { IsInt, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
    @ApiProperty({
        description: 'Service name',
        type: String,
        minLength: 2,
        maxLength: 80,
        example: 'Haircut',
    })
    @IsString()
    @Length(2, 80)
    name: string;

    @ApiPropertyOptional({
        description: 'Detailed description of the service',
        type: String,
        example: 'Includes wash and style',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'Duration of the service in minutes',
        type: Number,
        minimum: 10,
        maximum: 480,
        example: 60,
    })
    @IsInt()
    @Min(10)
    @Max(480)
    duration: number;

    @ApiProperty({
        description: 'Price of the service',
        type: Number,
        minimum: 1,
        maximum: 10000,
        example: 49.99,
    })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(1)
    @Max(10000)
    price: number;

    @ApiPropertyOptional({
        description: 'Default commission percentage for the service',
        type: Number,
        example: 10,
        nullable: true,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    defaultCommissionPercent?: number | null;

    @ApiProperty({
        description: 'Category identifier to which the service belongs',
        type: Number,
        example: 1,
    })
    @IsInt()
    categoryId: number;
}
