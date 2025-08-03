import { IsInt, IsDateString, IsString, IsOptional } from 'class-validator';

export class CreateAppointmentDto {
    @IsInt()
    clientId: number;

    @IsInt()
    employeeId: number;

    @IsInt()
    serviceId: number;

    @IsDateString()
    startTime: string;

    @IsOptional()
    @IsString()
    notes?: string;
}
