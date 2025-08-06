import { IsOptional, IsDateString, IsEnum, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '../appointment.entity';

export class UpdateAppointmentDto {
    @ApiPropertyOptional({
        description: 'Updated employee assigned to the appointment',
        type: Number,
        example: 3,
    })
    @IsOptional()
    @IsInt()
    employeeId?: number;

    @ApiPropertyOptional({
        description: 'Updated start time in ISO 8601 format',
        type: String,
        example: '2024-01-01T10:00:00Z',
    })
    @IsOptional()
    @IsDateString()
    startTime?: string;

    @ApiPropertyOptional({
        description: 'Updated end time in ISO 8601 format',
        type: String,
        example: '2024-01-01T11:00:00Z',
    })
    @IsOptional()
    @IsDateString()
    endTime?: string;

    @ApiPropertyOptional({
        description: 'Updated service identifier',
        type: Number,
        example: 4,
    })
    @IsOptional()
    @IsInt()
    serviceId?: number;

    @ApiPropertyOptional({
        description: 'Updated notes for the appointment',
        type: String,
        example: 'Customer requested a different stylist',
    })
    @IsOptional()
    notes?: string;

    @ApiPropertyOptional({
        description: 'Current status of the appointment',
        enum: AppointmentStatus,
        example: AppointmentStatus.Cancelled,
    })
    @IsOptional()
    @IsEnum(AppointmentStatus)
    status?: AppointmentStatus;

    @ApiPropertyOptional({
        description: 'Formula details used during the appointment',
        type: String,
        example: 'Foil highlight mix',
    })
    @IsOptional()
    formulaDescription?: string;
}
