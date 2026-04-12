import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class RescheduleAppointmentDto {
    @ApiProperty({ description: 'New start time ISO string' })
    @IsDateString()
    startTime: string;

    @ApiPropertyOptional({ description: 'New end time ISO string' })
    @IsOptional()
    @IsDateString()
    endTime?: string;

    @ApiPropertyOptional({ description: 'New employee ID (optional)' })
    @IsOptional()
    @IsNumber()
    employeeId?: number;

    @ApiPropertyOptional({
        description: 'Force reschedule even if there are conflicts',
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    force?: boolean;
}
