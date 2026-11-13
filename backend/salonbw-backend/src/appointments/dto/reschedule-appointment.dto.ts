import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsInt, IsBoolean, Min } from 'class-validator';

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
    @IsInt()
    @Min(1)
    employeeId?: number;

    @ApiPropertyOptional({
        description: 'Force reschedule even if there are conflicts',
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    force?: boolean;
}
