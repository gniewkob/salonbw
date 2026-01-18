import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNumber,
    IsBoolean,
    IsOptional,
    IsNotEmpty,
    IsDateString,
    IsArray,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateServiceDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    duration?: number;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    price?: number;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    category?: string;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    commissionPercent?: number;
}
