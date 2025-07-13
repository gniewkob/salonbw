import { IsOptional, IsDateString, IsEnum, IsInt } from 'class-validator';
import { AppointmentStatus } from '../appointment.entity';

export class UpdateAppointmentDto {
    @IsOptional()
    @IsInt()
    employeeId?: number;

    @IsOptional()
    @IsDateString()
    startTime?: string;

    @IsOptional()
    @IsDateString()
    endTime?: string;

    @IsOptional()
    @IsInt()
    serviceId?: number;

    @IsOptional()
    notes?: string;

    @IsOptional()
    @IsEnum(AppointmentStatus)
    status?: AppointmentStatus;
}
