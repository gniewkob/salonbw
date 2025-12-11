import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNumber,
    IsBoolean,
    IsOptional,
    IsNotEmpty,
    IsDateString,
    IsArray,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({})
    employeeId: number;

    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({})
    serviceId: number;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({})
    startTime: string;

    @IsNumber()
    @IsOptional()
    @ApiProperty({
        description: 'Required when creating appointments as Employee or Admin',
        required: false,
    })
    clientId?: number;
}
