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

export class CreateProductDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    brand: string;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    unitPrice: number;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    stock: number;
}
