import { ApiProperty } from '@nestjs/swagger';
import {
    ArrayMinSize,
    IsArray,
    IsInt,
    IsNumber,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductCommissionRuleDto {
    @ApiProperty()
    @IsInt()
    employeeId: number;

    @ApiProperty({ minimum: 0, maximum: 100 })
    @IsNumber()
    @Min(0)
    @Max(100)
    commissionPercent: number;
}

export class UpdateProductCommissionsDto {
    @ApiProperty({ type: [ProductCommissionRuleDto] })
    @IsArray()
    @ArrayMinSize(0)
    @ValidateNested({ each: true })
    @Type(() => ProductCommissionRuleDto)
    rules: ProductCommissionRuleDto[];
}
