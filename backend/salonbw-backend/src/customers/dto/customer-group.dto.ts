import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class CreateCustomerGroupDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    color?: string;

    @ApiPropertyOptional({ type: [Number] })
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    memberIds?: number[];
}

export class UpdateCustomerGroupDto extends CreateCustomerGroupDto {}

export class AddMembersDto {
    @ApiProperty({ type: [Number] })
    @IsArray()
    @IsNumber({}, { each: true })
    customerIds: number[];
}
