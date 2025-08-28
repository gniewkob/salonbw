import { IsISO8601, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAppointmentDto {
    @ApiProperty({ description: 'New start time ISO string' })
    @IsISO8601()
    startTime: string;

    @ApiProperty({ description: 'New end time ISO string', required: false })
    @IsOptional()
    @IsISO8601()
    endTime?: string;
}
