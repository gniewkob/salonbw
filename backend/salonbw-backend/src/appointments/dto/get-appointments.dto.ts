import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsDateString, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatus } from '../appointment.entity';

export class GetAppointmentsDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    from?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    to?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    employeeId?: number;

    @ApiProperty({
        required: false,
        description: 'Filter by appointment status',
    })
    @IsOptional()
    @IsString()
    status?: string;
}
