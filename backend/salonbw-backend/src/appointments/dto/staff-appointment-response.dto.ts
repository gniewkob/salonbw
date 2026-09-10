import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    Appointment,
    AppointmentStatus,
    PaymentMethod,
} from '../appointment.entity';
import { PriceType } from '../../services/service.entity';

class StaffAppointmentClientDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiPropertyOptional({ nullable: true })
    phone?: string | null;

    @ApiProperty()
    email: string;
}

class StaffAppointmentEmployeeDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;
}

class StaffAppointmentServiceDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    duration: number;

    @ApiProperty()
    price: number;

    @ApiProperty({ enum: PriceType })
    priceType: PriceType;

    @ApiProperty()
    isActive: boolean;

    @ApiProperty()
    onlineBooking: boolean;

    @ApiProperty()
    sortOrder: number;
}

class StaffAppointmentExtraServiceDto {
    @ApiProperty()
    serviceId: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    priceCents: number;

    @ApiProperty()
    discountCents: number;
}

export class StaffAppointmentResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    clientId: number;

    @ApiProperty()
    employeeId: number;

    @ApiProperty()
    serviceId: number;

    @ApiPropertyOptional({ nullable: true })
    serviceVariantId?: number | null;

    @ApiProperty()
    startTime: Date;

    @ApiProperty()
    endTime: Date;

    @ApiProperty({ enum: AppointmentStatus })
    status: AppointmentStatus;

    @ApiPropertyOptional({ nullable: true })
    clientComment?: string | null;

    @ApiPropertyOptional({ nullable: true })
    staffRecommendations?: string | null;

    @ApiPropertyOptional({ nullable: true })
    onlineAddonsSummary?: string | null;

    @ApiPropertyOptional({ nullable: true })
    onlineTotalDurationMinutes?: number | null;

    @ApiProperty()
    onlineDurationNeedsVerification: boolean;

    @ApiPropertyOptional({ nullable: true })
    internalNote?: string | null;

    @ApiPropertyOptional({ type: [StaffAppointmentExtraServiceDto] })
    extraServices?: StaffAppointmentExtraServiceDto[];

    @ApiPropertyOptional({ enum: PaymentMethod })
    paymentMethod?: PaymentMethod;

    @ApiPropertyOptional()
    paidAmount?: number;

    @ApiPropertyOptional()
    tipAmount?: number;

    @ApiPropertyOptional()
    discount?: number;

    @ApiPropertyOptional()
    finalizedAt?: Date;

    @ApiProperty({ type: StaffAppointmentClientDto })
    client: StaffAppointmentClientDto;

    @ApiProperty({ type: StaffAppointmentEmployeeDto })
    employee: StaffAppointmentEmployeeDto;

    @ApiProperty({ type: StaffAppointmentServiceDto })
    service: StaffAppointmentServiceDto;

    static from(appointment: Appointment): StaffAppointmentResponseDto {
        return {
            id: appointment.id,
            clientId: appointment.clientId,
            employeeId: appointment.employeeId,
            serviceId: appointment.serviceId,
            serviceVariantId: appointment.serviceVariantId,
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            status: appointment.status,
            clientComment: appointment.clientComment,
            staffRecommendations: appointment.staffRecommendations,
            onlineAddonsSummary: appointment.onlineAddonsSummary,
            onlineTotalDurationMinutes: appointment.onlineTotalDurationMinutes,
            onlineDurationNeedsVerification:
                appointment.onlineDurationNeedsVerification,
            internalNote: appointment.internalNote,
            extraServices: appointment.extraServices,
            paymentMethod: appointment.paymentMethod,
            paidAmount: appointment.paidAmount,
            tipAmount: appointment.tipAmount,
            discount: appointment.discount,
            finalizedAt: appointment.finalizedAt,
            client: {
                id: appointment.client.id,
                name: appointment.client.name,
                phone: appointment.client.phone,
                email: appointment.client.email,
            },
            employee: {
                id: appointment.employee.id,
                name: appointment.employee.name,
            },
            service: {
                id: appointment.service.id,
                name: appointment.service.name,
                duration: appointment.service.duration,
                price: appointment.service.price,
                priceType: appointment.service.priceType,
                isActive: appointment.service.isActive,
                onlineBooking: appointment.service.onlineBooking,
                sortOrder: appointment.service.sortOrder,
            },
        };
    }
}
