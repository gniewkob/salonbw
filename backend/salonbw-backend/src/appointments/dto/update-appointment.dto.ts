import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsInt } from 'class-validator';

export class UpdateAppointmentDto {
    @ApiProperty({ description: 'New start time ISO string' })
    @IsDateString()
    startTime: string;

    @ApiProperty({
        required: false,
        description: 'New end time ISO string',
    })
    @IsDateString()
    @IsOptional()
    endTime?: string;

    @ApiProperty({ required: false, description: 'Service variant ID' })
    @IsInt()
    @IsOptional()
    serviceVariantId?: number;
}
