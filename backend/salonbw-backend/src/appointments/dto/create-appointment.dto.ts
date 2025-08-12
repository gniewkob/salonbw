import { ApiProperty } from '@nestjs/swagger';
import { IsPositive, IsString, IsOptional } from 'class-validator';

export class CreateAppointmentDto {
    @ApiProperty()
    @IsPositive()
    employeeId: number;

    @ApiProperty()
    @IsPositive()
    serviceId: number;

    @ApiProperty()
    @IsString()
    startTime: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsPositive()
    clientId?: number;
}
