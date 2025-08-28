import { ApiProperty } from '@nestjs/swagger';
import { Appointment } from '../../appointments/appointment.entity';

export class DashboardSummaryDto {
    @ApiProperty({ description: 'Total number of clients', example: 42 })
    clientCount: number;

    @ApiProperty({ description: 'Total number of employees', example: 7 })
    employeeCount: number;

    @ApiProperty({
        description: 'Number of appointments scheduled for today',
        example: 5,
    })
    todayAppointments: number;

    @ApiProperty({ type: Appointment, isArray: true })
    upcomingAppointments: Appointment[];
}
