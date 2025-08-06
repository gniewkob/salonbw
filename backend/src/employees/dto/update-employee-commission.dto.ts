import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateEmployeeCommissionDto {
    @ApiProperty({
        description: 'Commission percentage for the employee',
        type: Number,
        minimum: 0,
        maximum: 100,
        example: 15,
    })
    @IsNumber()
    @Min(0)
    @Max(100)
    commissionBase: number;
}
