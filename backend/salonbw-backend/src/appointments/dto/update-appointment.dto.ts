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

export class UpdateAppointmentDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'New start time ISO string' })
    startTime: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'New end time ISO string', required: false })
    endTime?: string;
}
