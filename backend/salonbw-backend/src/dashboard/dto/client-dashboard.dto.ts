import { ApiProperty } from '@nestjs/swagger';
import {
    IsNumber,
    IsArray,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpcomingAppointmentDto {
    @ApiProperty({ description: 'Appointment ID' })
    @IsNumber()
    id: number;

    @ApiProperty({ description: 'Service ID (for "book again" deep link)' })
    @IsNumber()
    serviceId: number;

    @ApiProperty({ description: 'Service name' })
    serviceName: string;

    @ApiProperty({ description: 'Start time' })
    startTime: Date;

    @ApiProperty({ description: 'Appointment status' })
    status: string;

    @ApiProperty({ description: 'Employee name' })
    employeeName: string;
}

export class ServiceHistoryItemDto {
    @ApiProperty({ description: 'Service ID' })
    @IsNumber()
    id: number;

    @ApiProperty({ description: 'Service name' })
    name: string;

    @ApiProperty({ description: 'Number of times used' })
    @IsNumber()
    count: number;
}

export class RecentAppointmentDto {
    @ApiProperty({ description: 'Appointment ID' })
    @IsNumber()
    id: number;

    @ApiProperty({ description: 'Service ID (for "book again" deep link)' })
    @IsNumber()
    serviceId: number;

    @ApiProperty({ description: 'Service name' })
    serviceName: string;

    @ApiProperty({ description: 'Start time' })
    startTime: Date;

    @ApiProperty({ description: 'Appointment status' })
    status: string;

    @ApiProperty({ description: 'Employee name', required: false })
    @IsOptional()
    employeeName?: string;

    @ApiProperty({
        description: 'Client-visible visit note added by staff',
        required: false,
        nullable: true,
    })
    @IsOptional()
    @IsString()
    notes?: string | null;
}

export class ClientDashboardDto {
    @ApiProperty({
        description: 'Next upcoming appointment',
        type: UpcomingAppointmentDto,
        nullable: true,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => UpcomingAppointmentDto)
    upcomingAppointment: UpcomingAppointmentDto | null;

    @ApiProperty({ description: 'Total completed appointments' })
    @IsNumber()
    completedCount: number;

    @ApiProperty({
        description: 'Services used with frequency',
        type: [ServiceHistoryItemDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ServiceHistoryItemDto)
    serviceHistory: ServiceHistoryItemDto[];

    @ApiProperty({
        description: 'Recent appointments',
        type: [RecentAppointmentDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecentAppointmentDto)
    recentAppointments: RecentAppointmentDto[];

    @ApiProperty({
        description: 'Appointments where the salon proposed a new time',
    })
    @IsNumber()
    pendingRescheduleCount: number;

    @ApiProperty({
        description: 'Threads where the salon wrote last (awaiting reply)',
    })
    @IsNumber()
    newSalonMessageCount: number;
}
