import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class CreateCustomerTagDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    color?: string;
}

export class UpdateCustomerTagDto extends CreateCustomerTagDto {}

export class AssignTagsDto {
    @ApiProperty({ type: [Number] })
    @IsArray()
    @IsNumber({}, { each: true })
    tagIds: number[];
}
