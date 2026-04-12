import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAppointmentDto {
    @ApiProperty({ description: 'New start time' })
    @IsDate()
    @Type(() => Date)
    startTime: Date;

    @ApiProperty({
        required: false,
        description: 'New end time',
    })
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    endTime?: Date;

    @ApiProperty({ required: false, description: 'Service variant ID' })
    @IsInt()
    @IsOptional()
    serviceVariantId?: number;
}
