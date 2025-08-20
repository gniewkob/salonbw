import {
    ConflictException,
    Injectable,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Not } from 'typeorm';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { CommissionsService } from '../commissions/commissions.service';
import { Role } from '../users/role.enum';
import { Service as SalonService } from '../services/service.entity';
import { User } from '../users/user.entity';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { WhatsappService } from '../notifications/whatsapp.service';

@Injectable()
export class AppointmentsService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentsRepository: Repository<Appointment>,
        @InjectRepository(SalonService)
        private readonly servicesRepository: Repository<SalonService>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly commissionsService: CommissionsService,
        private readonly logService: LogService,
        private readonly whatsappService: WhatsappService,
    ) {}

    async create(data: Partial<Appointment>, user: User): Promise<Appointment> {
        if (!data.client?.id) {
            throw new BadRequestException('clientId is required');
        }
        if (!data.employee?.id) {
            throw new BadRequestException('employeeId is required');
        }
        const client = await this.usersRepository.findOne({
            where: { id: data.client.id },
        });
        if (!client) {
            throw new BadRequestException('Invalid clientId');
        }
        if (client.role !== Role.Client) {
            throw new BadRequestException(
                'Provided clientId does not belong to a client',
            );
        }
        const employee = await this.usersRepository.findOne({
            where: { id: data.employee.id },
        });
        if (!employee) {
            throw new BadRequestException('Invalid employeeId');
        }
        if (employee.role !== Role.Employee) {
            throw new BadRequestException(
                'Provided employeeId does not belong to an employee',
            );
        }
        data.client = client;
        data.employee = employee;
        if (
            !data.startTime ||
            isNaN(new Date(data.startTime).getTime()) ||
            data.startTime < new Date()
        ) {
            throw new BadRequestException('startTime must be in the future');
        }
        const service = await this.servicesRepository.findOne({
            where: { id: data.service?.id },
        });
        if (!service) {
            throw new BadRequestException('Invalid serviceId');
        }
        data.service = service;
        data.endTime = new Date(
            data.startTime.getTime() + service.duration * 60 * 1000,
        );
        const conflict = await this.appointmentsRepository.findOne({
            where: {
                employee: { id: data.employee.id },
                status: Not(AppointmentStatus.Cancelled),
                startTime: LessThan(data.endTime),
                endTime: MoreThan(data.startTime),
            },
        });
        if (conflict) {
            throw new ConflictException(
                'Employee is already booked for this time',
            );
        }
        const appointment = this.appointmentsRepository.create(data);
        const saved = await this.appointmentsRepository.save(appointment);
        const result = await this.findOne(saved.id);
        if (!result) {
            throw new Error('Appointment not found after creation');
        }
        try {
            await this.logService.logAction(
                user,
                LogAction.APPOINTMENT_CREATED,
                {
                    appointmentId: result.id,
                    serviceId: result.service.id,
                    serviceName: result.service.name,
                    clientId: result.client.id,
                    employeeId: result.employee.id,
                    entity: 'appointment',
                    id: result.id,
                },
            );
        } catch (error) {
            console.error('Failed to log appointment creation action', error);
        }
        if (client.phone) {
            const date = result.startTime.toISOString().split('T')[0];
            const time = result.startTime.toISOString().split('T')[1].slice(0, 5);
            try {
                await this.whatsappService.sendBookingConfirmation(
                    client.phone,
                    date,
                    time,
                );
            } catch (error) {
                console.error('Failed to send booking confirmation', error);
            }
        } else {
            console.warn(
                'Client has no phone number; skipping booking confirmation',
            );
        }
        return result;
    }

    findForUser(userId: number): Promise<Appointment[]> {
        return this.appointmentsRepository.find({
            where: [{ client: { id: userId } }, { employee: { id: userId } }],
            order: { startTime: 'ASC' },
            relations: ['formulas'],
        });
    }

    async findOne(id: number): Promise<Appointment | null> {
        const appointment = await this.appointmentsRepository.findOne({
            where: { id },
            relations: ['formulas'],
        });
        return appointment ?? null;
    }

    async cancel(id: number, user: User): Promise<Appointment | null> {
        const appointment = await this.findOne(id);
        if (!appointment) {
            return null;
        }
        if (
            appointment.status === AppointmentStatus.Completed ||
            appointment.status === AppointmentStatus.Cancelled
        ) {
            throw new BadRequestException(
                'Cannot cancel a completed or already cancelled appointment',
            );
        }
        await this.appointmentsRepository.update(id, {
            status: AppointmentStatus.Cancelled,
        });
        const updated = await this.findOne(id);
        if (updated) {
            try {
                await this.logService.logAction(
                    user,
                    LogAction.APPOINTMENT_CANCELLED,
                    {
                        action: 'cancel',
                        id: updated.id,
                        appointmentId: updated.id,
                        status: AppointmentStatus.Cancelled,
                    },
                );
            } catch (error) {
                console.error(
                    'Failed to log appointment cancellation action',
                    error,
                );
            }
        }
        return updated;
    }

    async completeAppointment(
        id: number,
        user: User,
    ): Promise<Appointment | null> {
        const appointment = await this.findOne(id);
        if (!appointment) {
            return null;
        }
        if (appointment.status === AppointmentStatus.Completed) {
            throw new BadRequestException('Appointment already completed');
        }
        if (appointment.status === AppointmentStatus.Cancelled) {
            throw new BadRequestException(
                'Cannot complete a cancelled appointment',
            );
        }
        await this.appointmentsRepository.manager.transaction(
            async (manager) => {
                await manager.update(Appointment, id, {
                    status: AppointmentStatus.Completed,
                });
                await this.commissionsService.createFromAppointment(
                    appointment,
                    user,
                    manager,
                );
            },
        );
        const updated = await this.findOne(id);
        if (updated) {
            try {
                await this.logService.logAction(
                    user,
                    LogAction.APPOINTMENT_COMPLETED,
                    {
                        action: 'complete',
                        id: updated.id,
                        appointmentId: updated.id,
                        status: AppointmentStatus.Completed,
                    },
                );
            } catch (error) {
                console.error(
                    'Failed to log appointment completion action',
                    error,
                );
            }
            if (updated.client.phone) {
                const date = updated.startTime
                    .toISOString()
                    .split('T')[0];
                const time = updated.startTime
                    .toISOString()
                    .split('T')[1]
                    .slice(0, 5);
                try {
                    await this.whatsappService.sendFollowUp(
                        updated.client.phone,
                        date,
                        time,
                    );
                } catch (error) {
                    console.error('Failed to send follow up message', error);
                }
            } else {
                console.warn(
                    'Client has no phone number; skipping follow up message',
                );
            }
        }
        return updated;
    }
}
