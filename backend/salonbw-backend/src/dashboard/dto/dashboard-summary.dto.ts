import { ApiProperty } from '@nestjs/swagger';
import {
    IsNumber,
    IsNotEmpty,
    IsArray,
    IsOptional,
    IsString,
    IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

class DashboardAppointmentDto {
    @IsNumber()
    @ApiProperty({ example: 1 })
    id: number;

    @IsDate()
    @Type(() => Date)
    @ApiProperty({ type: String, format: 'date-time' })
    startTime: Date;

    @IsDate()
    @Type(() => Date)
    @ApiProperty({ type: String, format: 'date-time' })
    endTime: Date;

    @IsString()
    @ApiProperty({ example: 'confirmed' })
    status: string;

    @IsString()
    @ApiProperty({ example: 'Jan Kowalski' })
    clientName: string;

    @IsString()
    @ApiProperty({ example: '+48123123123' })
    clientPhone: string;

    @IsString()
    @ApiProperty({ example: 'Strzyzenie meskie' })
    serviceName: string;

    @IsString()
    @ApiProperty({ example: 'Aleksandra Bodora' })
    employeeName: string;
}

export class DashboardSummaryDto {
    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ description: 'Total number of clients', example: 42 })
    clientCount: number;

    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ description: 'Total number of employees', example: 7 })
    employeeCount: number;

    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Active appointments today (all non-cancelled statuses)',
        example: 5,
    })
    todayAppointments: number;

    @IsNumber()
    @ApiProperty({
        description: 'Online bookings waiting for confirmation',
        example: 2,
    })
    onlinePendingCount: number;

    @IsNumber()
    @ApiProperty({
        description: 'Revenue from completed appointments today (PLN)',
        example: 480,
    })
    revenueToday: number;

    @IsNumber()
    @ApiProperty({
        description: 'Revenue from completed appointments this month (PLN)',
        example: 8400,
    })
    revenueThisMonth: number;

    @IsNumber()
    @ApiProperty({
        description: 'Completed appointments this month',
        example: 120,
    })
    completedThisMonth: number;

    @IsArray()
    @IsNotEmpty()
    @ApiProperty({ type: () => [DashboardAppointmentDto] })
    upcomingAppointments: DashboardAppointmentDto[];

    @IsArray()
    @IsOptional()
    @ApiProperty({
        description: 'Appointments currently in progress',
        type: () => [DashboardAppointmentDto],
    })
    inProgressAppointments: DashboardAppointmentDto[];
}
