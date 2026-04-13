import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class RescheduleAppointmentDto {
    @ApiProperty({ description: 'New start time' })
    @IsDate()
    @Type(() => Date)
    startTime: Date;

    @ApiPropertyOptional({ description: 'New end time' })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    endTime?: Date;

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
