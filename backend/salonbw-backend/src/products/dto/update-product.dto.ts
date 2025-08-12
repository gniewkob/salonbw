import { PartialType } from '@nestjs/mapped-types';
import { IsInt, Min, IsOptional } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
    @IsInt()
    @Min(0)
    @IsOptional()
    stock?: number;
}
