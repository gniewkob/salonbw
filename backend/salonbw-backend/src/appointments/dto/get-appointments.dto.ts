import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAppointmentsDto {
    @ApiProperty({
        required: false,
        description: 'Start date for filtering appointments',
    })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    from?: Date;

    @ApiProperty({
        required: false,
        description: 'End date for filtering appointments',
    })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    to?: Date;

    @ApiProperty({
        required: false,
        description: 'Employee ID for filtering appointments',
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    employeeId?: number;

    @ApiProperty({ required: false, description: 'Page number', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number;

    @ApiProperty({ required: false, description: 'Items per page', default: 50 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number;
}
