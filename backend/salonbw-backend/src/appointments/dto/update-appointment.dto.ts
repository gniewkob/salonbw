import { IsISO8601 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAppointmentDto {
    @ApiProperty({ description: 'New start time ISO string' })
    @IsISO8601()
    startTime: string;
}
