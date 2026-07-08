import { ApiProperty } from '@nestjs/swagger';
import {
    IsInt,
    IsDateString,
    IsOptional,
    IsBoolean,
    IsString,
    MaxLength,
    IsArray,
    ArrayMaxSize,
    ArrayUnique,
} from 'class-validator';

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
    @IsDateString()
    startTime: string;

    @ApiProperty({
        required: false,
        description: 'Required when creating appointments as Employee or Admin',
    })
    @IsInt()
    @IsOptional()
    clientId?: number;

    @ApiProperty({
        required: false,
        description:
            'Set to true when client books online — creates appointment with online_pending status',
    })
    @IsBoolean()
    @IsOptional()
    reservedOnline?: boolean;

    @ApiProperty({
        required: false,
        description:
            'Client comment added while booking (preferences/remarks visible to staff and client).',
    })
    @IsString()
    @IsOptional()
    @MaxLength(1000)
    clientComment?: string;

    @ApiProperty({
        required: false,
        type: [Number],
        description:
            'Optional add-on services requested during online booking. Their durations extend the appointment block.',
    })
    @IsArray()
    @ArrayMaxSize(5)
    @ArrayUnique()
    @IsInt({ each: true })
    @IsOptional()
    addonServiceIds?: number[];
}
