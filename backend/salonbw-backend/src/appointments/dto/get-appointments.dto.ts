import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAppointmentsDto {
    @ApiProperty({
        required: false,
        description: 'Start date for filtering appointments (ISO 8601)',
    })
    @IsOptional()
    @IsDateString()
    from?: string;

    @ApiProperty({
        required: false,
        description: 'End date for filtering appointments (ISO 8601)',
    })
    @IsOptional()
    @IsDateString()
    to?: string;

    @ApiProperty({
        required: false,
        description: 'Employee ID for filtering appointments',
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    employeeId?: number;
}
