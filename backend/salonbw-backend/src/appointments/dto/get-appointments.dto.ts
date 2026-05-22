import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsDateString, IsString, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatus } from '../appointment.entity';

export class GetAppointmentsDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    from?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    to?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    employeeId?: number;

    @ApiProperty({ required: false, enum: AppointmentStatus })
    @IsOptional()
    @IsEnum(AppointmentStatus)
    status?: AppointmentStatus;

    @ApiProperty({ required: false, description: 'Client name or phone search' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiProperty({ required: false, default: 50 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number;
}
