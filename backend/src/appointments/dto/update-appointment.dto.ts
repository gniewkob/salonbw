import { IsOptional, IsDateString, IsEnum, IsInt } from 'class-validator';
import { AppointmentStatus } from '../appointment.entity';

export class UpdateAppointmentDto {
    @IsOptional()
    @IsInt()
    employeeId?: number;

    @IsOptional()
    @IsDateString()
    scheduledAt?: string;

    @IsOptional()
    @IsEnum(AppointmentStatus)
    status?: AppointmentStatus;
}
