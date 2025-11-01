import {
    ConflictException,
    Injectable,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    Repository,
    LessThan,
    MoreThan,
    Not,
    Between,
    FindOptionsWhere,
} from 'typeorm';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { CommissionsService } from '../commissions/commissions.service';
import { Role } from '../users/role.enum';
import { Service as SalonService } from '../services/service.entity';
import { User } from '../users/user.entity';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { WhatsappService } from '../notifications/whatsapp.service';
import { MetricsService } from '../observability/metrics.service';
import { Optional } from '@nestjs/common';

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
        @Optional() private readonly metrics?: MetricsService,
    ) {}

    private async loadClientOrThrow(id: number): Promise<User> {
        const client = await this.usersRepository.findOne({ where: { id } });
        if (!client) throw new BadRequestException('Invalid clientId');
        if (client.role !== Role.Client)
            throw new BadRequestException(
                'Provided clientId does not belong to a client',
            );
        return client;
    }

    private async loadEmployeeOrThrow(id: number): Promise<User> {
        const employee = await this.usersRepository.findOne({ where: { id } });
        if (!employee) throw new BadRequestException('Invalid employeeId');
        if (employee.role !== Role.Employee)
            throw new BadRequestException(
                'Provided employeeId does not belong to an employee',
            );
        return employee;
    }

    private async loadServiceOrThrow(
        id: number | undefined,
    ): Promise<SalonService> {
        const service = await this.servicesRepository.findOne({
            where: { id },
        });
        if (!service) throw new BadRequestException('Invalid serviceId');
        return service;
    }

    private ensureFuture(date: Date | undefined): asserts date is Date {
        if (!date || isNaN(new Date(date).getTime()) || date < new Date()) {
            throw new BadRequestException('startTime must be in the future');
        }
    }

    private computeEnd(start: Date, durationMinutes: number): Date {
        return new Date(start.getTime() + durationMinutes * 60 * 1000);
    }

    private async assertNoConflict(
        employeeId: number,
        startTime: Date,
        endTime: Date,
        excludeId?: number,
    ): Promise<void> {
        const where: FindOptionsWhere<Appointment> = {
            employee: { id: employeeId },
            status: Not(AppointmentStatus.Cancelled),
            startTime: LessThan(endTime),
            endTime: MoreThan(startTime),
            ...(excludeId ? { id: Not(excludeId) } : {}),
        };
        const conflict = await this.appointmentsRepository.findOne({ where });
        if (conflict) {
            throw new ConflictException(
                'Employee is already booked for this time',
            );
        }
    }

    private async safeLog(
        user: User | null,
        action: LogAction,
        payload: Record<string, unknown>,
    ): Promise<void> {
        try {
            await this.logService.logAction(user, action, payload);
        } catch (error) {
            console.error('Failed to persist log action', error);
        }
    }

    private formatDate(d: Date): { date: string; time: string } {
        const date = d.toISOString().split('T')[0];
        const time = d.toISOString().split('T')[1].slice(0, 5);
        return { date, time };
    }

    findAllInRange(params: {
        from?: Date;
        to?: Date;
        employeeId?: number;
    }): Promise<Appointment[]> {
        const where: FindOptionsWhere<Appointment> & {
            employee?: { id: number };
        } = {};
        if (params.employeeId) where.employee = { id: params.employeeId };
        if (params.from && params.to) {
            where.startTime = Between(params.from, params.to);
        } else if (params.from) {
            where.startTime = MoreThan(params.from);
        } else if (params.to) {
            where.startTime = LessThan(params.to);
        }
        return this.appointmentsRepository.find({
            where,
            order: { startTime: 'ASC' },
            relations: ['formulas'],
        });
    }

    async create(data: Partial<Appointment>, user: User): Promise<Appointment> {
        if (!data.client?.id)
            throw new BadRequestException('clientId is required');
        if (!data.employee?.id)
            throw new BadRequestException('employeeId is required');
        const client = await this.loadClientOrThrow(data.client.id);
        const employee = await this.loadEmployeeOrThrow(data.employee.id);
        data.client = client;
        data.employee = employee;
        this.ensureFuture(data.startTime);
        const service = await this.loadServiceOrThrow(data.service?.id);
        data.service = service;
        data.endTime = this.computeEnd(data.startTime, service.duration);
        await this.assertNoConflict(employee.id, data.startTime, data.endTime);
        const appointment = this.appointmentsRepository.create(data);
        const saved = await this.appointmentsRepository.save(appointment);
        const result = await this.findOne(saved.id);
        if (!result) {
            throw new Error('Appointment not found after creation');
        }
        this.metrics?.incAppointmentCreated();
        await this.safeLog(user, LogAction.APPOINTMENT_CREATED, {
            appointmentId: result.id,
            serviceId: result.service.id,
            serviceName: result.service.name,
            clientId: result.client.id,
            employeeId: result.employee.id,
            entity: 'appointment',
            id: result.id,
        });
        if (client.phone && client.receiveNotifications) {
            const { date, time } = this.formatDate(result.startTime);
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
                'Client has no phone number or notifications disabled; skipping booking confirmation',
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
            this.metrics?.incAppointmentCompleted();
            await this.safeLog(user, LogAction.APPOINTMENT_COMPLETED, {
                action: 'complete',
                id: updated.id,
                appointmentId: updated.id,
                status: AppointmentStatus.Completed,
            });
            if (updated.client.phone && updated.client.receiveNotifications) {
                const { date, time } = this.formatDate(updated.startTime);
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
                    'Client has no phone number or notifications disabled; skipping follow up message',
                );
            }
        }
        return updated;
    }

    async updateStartTime(
        id: number,
        startTime: Date,
        endTime: Date | undefined,
        user: User,
    ): Promise<Appointment | null> {
        const appointment = await this.findOne(id);
        if (!appointment) {
            return null;
        }
        if (appointment.status !== AppointmentStatus.Scheduled) {
            throw new BadRequestException(
                'Only scheduled appointments can be rescheduled',
            );
        }
        if (!startTime || isNaN(startTime.getTime())) {
            throw new BadRequestException('startTime must be a valid date');
        }
        const newEnd = endTime
            ? endTime
            : new Date(
                  startTime.getTime() +
                      appointment.service.duration * 60 * 1000,
              );
        await this.assertNoConflict(
            appointment.employee.id,
            startTime,
            newEnd,
            id,
        );
        await this.appointmentsRepository.update(id, {
            startTime,
            endTime: newEnd,
        });
        const updated = await this.findOne(id);
        if (updated) {
            await this.safeLog(user, LogAction.APPOINTMENT_RESCHEDULED, {
                action: 'reschedule',
                appointmentId: updated.id,
                startTime: updated.startTime,
                endTime: updated.endTime,
            });
        }
        return updated;
    }
}
