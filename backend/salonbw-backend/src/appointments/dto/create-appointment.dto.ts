import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsDateString, IsOptional } from 'class-validator';

export class CreateAppointmentDto {
    @ApiProperty()
    @IsInt()
    employeeId: number;

    @ApiProperty()
    @IsInt()
    serviceId: number;

    @ApiProperty()
    @IsDateString()
    startTime: string;

    @ApiProperty({
        required: false,
        description: 'Required when creating appointments as Employee or Admin',
    })
    @IsInt()
    @IsOptional()
    clientId?: number;
}
