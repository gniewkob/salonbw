import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

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
    @ApiProperty({})
    upcomingAppointments: any[];
}
