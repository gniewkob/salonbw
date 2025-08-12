import { ApiProperty } from '@nestjs/swagger';
import { IsPositive, IsOptional, IsISO8601 } from 'class-validator';

export class CreateAppointmentDto {
    @ApiProperty()
    @IsPositive()
    employeeId: number;

    @ApiProperty()
    @IsPositive()
    serviceId: number;

    @ApiProperty()
    @IsISO8601()
    startTime: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsPositive()
    clientId?: number;
}
