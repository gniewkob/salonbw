import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AppointmentStatus } from '../appointment.entity';

export class UpdateAppointmentStatusDto {
    @ApiProperty({ enum: AppointmentStatus })
    @IsEnum(AppointmentStatus)
    status: AppointmentStatus;
}
