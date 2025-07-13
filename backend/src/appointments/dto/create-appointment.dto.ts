import { IsInt, IsDateString } from 'class-validator';

export class CreateAppointmentDto {
    @IsInt()
    clientId: number;

    @IsInt()
    employeeId: number;

    @IsDateString()
    scheduledAt: string;
}
