import { IsInt, IsDateString } from 'class-validator';

export class CreateAppointmentDto {
    @IsInt()
    clientId: number;

    @IsInt()
    employeeId: number;

    @IsInt()
    serviceId: number;

    @IsDateString()
    startTime: string;
}
