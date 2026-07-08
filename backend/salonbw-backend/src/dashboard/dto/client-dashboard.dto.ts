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

    @ApiProperty({
        description: 'Previous start time when salon proposed a reschedule',
        required: false,
        nullable: true,
    })
    @IsOptional()
    reschedulePreviousStartTime?: Date | null;

    @ApiProperty({
        description: 'Previous end time when salon proposed a reschedule',
        required: false,
        nullable: true,
    })
    @IsOptional()
    reschedulePreviousEndTime?: Date | null;

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

    @ApiProperty({
        description: 'Previous start time when salon proposed a reschedule',
        required: false,
        nullable: true,
    })
    @IsOptional()
    reschedulePreviousStartTime?: Date | null;

    @ApiProperty({
        description: 'Previous end time when salon proposed a reschedule',
        required: false,
        nullable: true,
    })
    @IsOptional()
    reschedulePreviousEndTime?: Date | null;

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

    @ApiProperty({
        description: 'Comment written by the client while booking',
        required: false,
        nullable: true,
    })
    @IsOptional()
    @IsString()
    clientComment?: string | null;

    @ApiProperty({
        description: 'Staff recommendations saved after finalizing the visit',
        required: false,
        nullable: true,
    })
    @IsOptional()
    @IsString()
    staffRecommendations?: string | null;

    @ApiProperty({
        description: 'Online add-on services selected with the booking',
        required: false,
        nullable: true,
    })
    @IsOptional()
    @IsString()
    onlineAddonsSummary?: string | null;

    @ApiProperty({
        description: 'Total duration after online add-ons were included',
        required: false,
        nullable: true,
    })
    @IsOptional()
    @IsNumber()
    onlineTotalDurationMinutes?: number | null;

    @ApiProperty({
        description:
            'Whether staff still need to verify online add-on duration',
        required: false,
    })
    @IsOptional()
    onlineDurationNeedsVerification?: boolean;
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

    @ApiProperty({
        description:
            'First appointment where the salon proposed a new time and the client must accept or cancel',
        type: UpcomingAppointmentDto,
        nullable: true,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => UpcomingAppointmentDto)
    pendingRescheduleAppointment: UpcomingAppointmentDto | null;

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
