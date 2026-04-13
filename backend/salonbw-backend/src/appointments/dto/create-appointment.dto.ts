import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
    @ApiProperty()
    @IsInt()
    employeeId: number;

    @ApiProperty()
    @IsInt()
    serviceId: number;

    @ApiProperty({ required: false })
    @IsInt()
    @IsOptional()
    serviceVariantId?: number;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    startTime: Date;

    @ApiProperty({
        required: false,
        description: 'Required when creating appointments as Employee or Admin',
    })
    @IsInt()
    @IsOptional()
    clientId?: number;
}
