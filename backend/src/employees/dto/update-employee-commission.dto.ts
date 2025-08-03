import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateEmployeeCommissionDto {
    @ApiProperty({ minimum: 0, maximum: 100, description: 'Commission percentage' })
    @IsNumber()
    @Min(0)
    @Max(100)
    commissionBase: number;
}
