import { IsInt, IsDateString, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
    @ApiProperty({
        description: 'Unique identifier of the client',
        type: Number,
        example: 1,
    })
    @IsInt()
    clientId: number;

    @ApiProperty({
        description: 'Employee assigned to the appointment',
        type: Number,
        example: 2,
    })
    @IsInt()
    employeeId: number;

    @ApiProperty({
        description: 'Service to be performed during the appointment',
        type: Number,
        example: 3,
    })
    @IsInt()
    serviceId: number;

    @ApiProperty({
        description: 'Start time in ISO 8601 format',
        type: String,
        example: '2024-01-01T09:00:00Z',
    })
    @IsDateString()
    startTime: string;

    @ApiPropertyOptional({
        description: 'Additional notes for the appointment',
        type: String,
        example: 'Customer requests a window seat',
    })
    @IsOptional()
    @IsString()
    notes?: string;
}
