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
        description: 'Number of appointments scheduled for today',
        example: 5,
    })
    todayAppointments: number;

    @IsArray()
    @IsNotEmpty()
    @ApiProperty({})
    upcomingAppointments: any[];
}
