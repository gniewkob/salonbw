import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Appointment, AppointmentStatus } from '../appointment.entity';

export class ClientAppointmentResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    clientId: number;

    @ApiProperty()
    employeeId: number;

    @ApiProperty()
    serviceId: number;

    @ApiPropertyOptional({ type: Number, nullable: true })
    serviceVariantId?: number | null;

    @ApiProperty()
    startTime: Date;

    @ApiProperty()
    endTime: Date;

    @ApiProperty({ enum: AppointmentStatus })
    status: AppointmentStatus;

    @ApiPropertyOptional({ type: String, nullable: true })
    clientComment?: string | null;

    @ApiPropertyOptional({ type: String, nullable: true })
    staffRecommendations?: string | null;

    @ApiPropertyOptional({ type: String, nullable: true })
    onlineAddonsSummary?: string | null;

    @ApiPropertyOptional({ type: Number, nullable: true })
    onlineTotalDurationMinutes?: number | null;

    @ApiProperty()
    onlineDurationNeedsVerification: boolean;

    static from(appointment: Appointment): ClientAppointmentResponseDto {
        return {
            id: appointment.id,
            clientId: appointment.clientId,
            employeeId: appointment.employeeId,
            serviceId: appointment.serviceId,
            serviceVariantId: appointment.serviceVariantId,
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            status: appointment.status,
            clientComment: appointment.clientComment ?? null,
            staffRecommendations: appointment.staffRecommendations ?? null,
            onlineAddonsSummary: appointment.onlineAddonsSummary ?? null,
            onlineTotalDurationMinutes:
                appointment.onlineTotalDurationMinutes ?? null,
            onlineDurationNeedsVerification:
                appointment.onlineDurationNeedsVerification ?? false,
        };
    }
}

export class AppointmentCreatedResponseDto {
    @ApiProperty()
    id: number;
}
