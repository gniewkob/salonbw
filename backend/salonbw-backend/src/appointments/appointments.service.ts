import {
    ConflictException,
    Injectable,
    BadRequestException,
    ForbiddenException,
    Inject,
    forwardRef,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    Repository,
    LessThan,
    MoreThan,
    Not,
    Between,
    FindOptionsWhere,
    ILike,
} from 'typeorm';
import {
    Appointment,
    AppointmentStatus,
    PaymentMethod,
} from './appointment.entity';
import { CommissionsService } from '../commissions/commissions.service';
import { Role } from '../users/role.enum';
import { Service as SalonService } from '../services/service.entity';
import { ServiceVariant } from '../services/entities/service-variant.entity';
import { ServiceRecipeItem } from '../services/entities/service-recipe-item.entity';
import { User } from '../users/user.entity';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { WhatsappService } from '../notifications/whatsapp.service';
import { EmailsService } from '../emails/emails.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { MetricsService } from '../observability/metrics.service';
import { Optional } from '@nestjs/common';
import { RetailService } from '../retail/retail.service';
import { FinalizeAppointmentDto } from './dto/finalize-appointment.dto';
import { Log } from '../logs/log.entity';

@Injectable()
export class AppointmentsService {
    private readonly logger = new Logger(AppointmentsService.name);

    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentsRepository: Repository<Appointment>,
        @InjectRepository(SalonService)
        private readonly servicesRepository: Repository<SalonService>,
        @InjectRepository(ServiceVariant)
        private readonly serviceVariantsRepository: Repository<ServiceVariant>,
        @InjectRepository(ServiceRecipeItem)
        private readonly recipeItemsRepository: Repository<ServiceRecipeItem>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly commissionsService: CommissionsService,
        private readonly logService: LogService,
        private readonly whatsappService: WhatsappService,
        @Optional() private readonly metrics?: MetricsService,
        @Optional()
        @Inject(forwardRef(() => RetailService))
        private readonly retailService?: RetailService,
        @Optional()
        private readonly loyaltyService?: LoyaltyService,
        @Optional()
        private readonly emailsService?: EmailsService,
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

    private async loadServiceVariantOrThrow(
        variantId: number | undefined,
        serviceId: number,
    ): Promise<ServiceVariant> {
        const variant = await this.serviceVariantsRepository.findOne({
            where: { id: variantId },
        });
        if (!variant || variant.serviceId !== serviceId) {
            throw new BadRequestException('Invalid serviceVariantId');
        }
        return variant;
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

    async findAllInRange(params: {
        from?: Date;
        to?: Date;
        employeeId?: number;
        status?: string;
    }): Promise<Appointment[]> {
        const where: FindOptionsWhere<Appointment> & {
            employee?: { id: number };
        } = {};
        if (params.employeeId) where.employee = { id: params.employeeId };
        if (params.status) where.status = params.status as AppointmentStatus;
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
            relations: ['client', 'employee', 'service', 'serviceVariant'],
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
        const candidateVariantId =
            data.serviceVariant?.id ?? data.serviceVariantId ?? undefined;
        if (candidateVariantId !== undefined) {
            const variant = await this.loadServiceVariantOrThrow(
                candidateVariantId,
                service.id,
            );
            data.serviceVariant = variant;
            data.serviceVariantId = variant.id;
            data.endTime = this.computeEnd(data.startTime, variant.duration);
        } else {
            data.endTime = this.computeEnd(data.startTime, service.duration);
        }
        await this.assertNoConflict(employee.id, data.startTime, data.endTime);
        const isClientSelfBooking = user.id === client.id;
        if (isClientSelfBooking) {
            data.status = AppointmentStatus.OnlinePending;
        }
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
        const { date, time } = this.formatDate(result.startTime);
        if (client.phone && client.receiveNotifications) {
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
        // Notify employee when client self-books
        if (
            isClientSelfBooking &&
            employee.phone &&
            employee.receiveNotifications
        ) {
            try {
                const clientName = client.name ?? client.email ?? 'Klient';
                const serviceName = result.service?.name ?? '';
                await this.whatsappService.sendNewBookingToEmployee(
                    employee.phone,
                    clientName,
                    serviceName,
                    date,
                    time,
                );
            } catch (error) {
                console.error(
                    'Failed to send new booking notification to employee',
                    error,
                );
            }
        }
        // E-mail to the salon mailbox on every client self-booking — the
        // reliable channel (WhatsApp above depends on the employee's phone,
        // consent flag and WhatsApp API config). MVP L2.
        if (isClientSelfBooking && this.emailsService) {
            const alertTo =
                process.env.BOOKING_ALERT_EMAIL || 'kontakt@salon-bw.pl';
            try {
                await this.emailsService.send({
                    to: alertTo,
                    subject: `Nowa rezerwacja online — ${date} ${time}`,
                    template:
                        'Nowa rezerwacja online czeka na potwierdzenie.\n\n' +
                        'Klientka: {{clientName}} ({{clientContact}})\n' +
                        'Usługa: {{serviceName}}\n' +
                        'Pracownik: {{employeeName}}\n' +
                        'Termin: {{date}} {{time}}\n\n' +
                        'Potwierdź w panelu: {{panelUrl}}',
                    data: {
                        clientName: client.name ?? client.email ?? 'Klient',
                        clientContact: client.phone ?? client.email ?? '—',
                        serviceName: result.service?.name ?? '—',
                        employeeName: employee.name ?? '—',
                        date,
                        time,
                        panelUrl: 'https://panel.salon-bw.pl/calendar',
                    },
                });
            } catch (error) {
                console.error(
                    'Failed to send new online booking email alert',
                    error,
                );
            }
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
            relations: [
                'formulas',
                'service',
                'serviceVariant',
                'client',
                'employee',
            ],
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

    async requestCancellation(
        id: number,
        user: User,
        reason?: string,
    ): Promise<Appointment | null> {
        const appointment = await this.findOne(id);
        if (!appointment) {
            return null;
        }
        if (appointment.client.id !== user.id) {
            throw new ForbiddenException(
                'Only appointment owner can request cancellation',
            );
        }
        if (appointment.startTime.getTime() <= Date.now()) {
            throw new BadRequestException(
                'Cancellation request is allowed only for future appointments',
            );
        }
        if (
            appointment.status === AppointmentStatus.Cancelled ||
            appointment.status === AppointmentStatus.Completed
        ) {
            throw new BadRequestException(
                'Cannot request cancellation for completed or cancelled appointment',
            );
        }

        await this.safeLog(user, LogAction.APPOINTMENT_CANCELLATION_REQUESTED, {
            action: 'cancellation_request',
            id: appointment.id,
            appointmentId: appointment.id,
            appointmentStatus: appointment.status,
            reason: typeof reason === 'string' ? reason.trim() : undefined,
            entity: 'appointment',
        });

        return appointment;
    }

    async requestReschedule(
        id: number,
        user: User,
        reason?: string,
    ): Promise<Appointment | null> {
        const appointment = await this.findOne(id);
        if (!appointment) {
            return null;
        }
        if (appointment.client.id !== user.id) {
            throw new ForbiddenException(
                'Only appointment owner can request reschedule',
            );
        }
        if (appointment.startTime.getTime() <= Date.now()) {
            throw new BadRequestException(
                'Reschedule request is allowed only for future appointments',
            );
        }
        if (
            appointment.status === AppointmentStatus.Cancelled ||
            appointment.status === AppointmentStatus.Completed
        ) {
            throw new BadRequestException(
                'Cannot request reschedule for completed or cancelled appointment',
            );
        }

        await this.safeLog(user, LogAction.APPOINTMENT_RESCHEDULE_REQUESTED, {
            action: 'reschedule_request',
            id: appointment.id,
            appointmentId: appointment.id,
            appointmentStatus: appointment.status,
            reason: typeof reason === 'string' ? reason.trim() : undefined,
            entity: 'appointment',
        });

        return appointment;
    }

    async listCancellationRequests(limit = 50): Promise<
        Array<{
            appointmentId: number;
            requestedAt: string;
            reason: string | null;
            client: { id: number; name: string } | null;
            service: { id: number; name: string } | null;
            startTime: string | null;
            status: AppointmentStatus | null;
        }>
    > {
        const pageSize = Math.min(Math.max(limit, 1), 200);
        const logsResult = await this.logService.findAll({
            action: LogAction.APPOINTMENT_CANCELLATION_REQUESTED,
            page: 1,
            limit: pageSize,
        });

        const rows = await Promise.all(
            logsResult.data.map(async (log: Log) => {
                const details =
                    typeof log.description === 'object' && log.description
                        ? log.description
                        : null;
                const appointmentId = Number(details?.appointmentId);
                if (!Number.isFinite(appointmentId) || appointmentId <= 0) {
                    return null;
                }
                const appointment = await this.findOne(appointmentId);
                return {
                    appointmentId,
                    requestedAt: log.timestamp.toISOString(),
                    reason:
                        typeof details?.reason === 'string'
                            ? details.reason
                            : null,
                    client: appointment?.client
                        ? {
                              id: appointment.client.id,
                              name: appointment.client.name,
                          }
                        : null,
                    service: appointment?.service
                        ? {
                              id: appointment.service.id,
                              name: appointment.service.name,
                          }
                        : null,
                    startTime: appointment?.startTime
                        ? appointment.startTime.toISOString()
                        : null,
                    status: appointment?.status ?? null,
                };
            }),
        );

        return rows.filter(
            (row): row is NonNullable<typeof row> => row !== null,
        );
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
        serviceVariantId: number | null | undefined,
        user: User,
    ): Promise<Appointment | null> {
        const appointment = await this.findOne(id);
        if (!appointment) {
            return null;
        }
        const reschedulableStatuses = [
            AppointmentStatus.Scheduled,
            AppointmentStatus.Confirmed,
            AppointmentStatus.OnlinePending,
            AppointmentStatus.RescheduledPending,
        ];
        if (!reschedulableStatuses.includes(appointment.status)) {
            throw new BadRequestException(
                'Only scheduled or confirmed appointments can be rescheduled',
            );
        }
        if (!startTime || isNaN(startTime.getTime())) {
            throw new BadRequestException('startTime must be a valid date');
        }
        let duration =
            appointment.serviceVariant?.duration ??
            appointment.service.duration;
        if (serviceVariantId !== undefined) {
            if (serviceVariantId === null || serviceVariantId === 0) {
                appointment.serviceVariant = null;
                appointment.serviceVariantId = null;
                duration = appointment.service.duration;
            } else {
                const variant = await this.loadServiceVariantOrThrow(
                    serviceVariantId,
                    appointment.service.id,
                );
                appointment.serviceVariant = variant;
                appointment.serviceVariantId = variant.id;
                duration = variant.duration;
            }
        }
        const newEnd = endTime
            ? endTime
            : new Date(startTime.getTime() + duration * 60 * 1000);
        await this.assertNoConflict(
            appointment.employee.id,
            startTime,
            newEnd,
            id,
        );
        // When staff reschedules a confirmed appointment, flag it so the
        // client can accept the new time before it moves back to confirmed.
        const newStatus =
            appointment.status === AppointmentStatus.Confirmed
                ? AppointmentStatus.RescheduledPending
                : appointment.status;

        await this.appointmentsRepository.update(id, {
            startTime,
            endTime: newEnd,
            serviceVariantId: appointment.serviceVariantId ?? null,
            status: newStatus,
        });
        const updated = await this.findOne(id);
        if (updated) {
            await this.safeLog(user, LogAction.APPOINTMENT_RESCHEDULED, {
                action: 'reschedule',
                appointmentId: updated.id,
                startTime: updated.startTime,
                endTime: updated.endTime,
            });
            // Notify client about rescheduled appointment
            if (newStatus === AppointmentStatus.RescheduledPending) {
                const client = updated.client;
                if (client?.phone && client.receiveNotifications) {
                    const { date, time } = this.formatDate(updated.startTime);
                    try {
                        await this.whatsappService.sendRescheduleNotification(
                            client.phone,
                            date,
                            time,
                        );
                    } catch {
                        this.logger.warn(
                            'Failed to send reschedule WhatsApp notification',
                        );
                    }
                }
            }
        }
        return updated;
    }

    async reschedule(
        id: number,
        startTime: Date,
        endTime: Date | undefined,
        employeeId: number | undefined,
        force: boolean,
        user: User,
    ): Promise<Appointment | null> {
        const appointment = await this.findOne(id);
        if (!appointment) {
            return null;
        }

        if (
            appointment.status !== AppointmentStatus.Scheduled &&
            appointment.status !== AppointmentStatus.Confirmed
        ) {
            throw new BadRequestException(
                'Only scheduled or confirmed appointments can be rescheduled',
            );
        }

        if (!startTime || isNaN(startTime.getTime())) {
            throw new BadRequestException('startTime must be a valid date');
        }

        const targetEmployeeId = employeeId ?? appointment.employee.id;
        let employee = appointment.employee;

        if (employeeId && employeeId !== appointment.employee.id) {
            employee = await this.loadEmployeeOrThrow(employeeId);
        }

        const duration =
            appointment.serviceVariant?.duration ??
            appointment.service.duration;
        const newEnd = endTime
            ? endTime
            : new Date(startTime.getTime() + duration * 60 * 1000);

        if (!force) {
            await this.assertNoConflict(
                targetEmployeeId,
                startTime,
                newEnd,
                id,
            );
        }

        const updateData: Partial<Appointment> = {
            startTime,
            endTime: newEnd,
            status: AppointmentStatus.RescheduledPending,
        };

        if (employeeId && employeeId !== appointment.employee.id) {
            updateData.employee = employee;
        }

        await this.appointmentsRepository.update(id, updateData);

        const updated = await this.findOne(id);
        if (updated) {
            await this.safeLog(user, LogAction.APPOINTMENT_RESCHEDULED, {
                action: 'reschedule',
                appointmentId: updated.id,
                startTime: updated.startTime,
                endTime: updated.endTime,
                employeeId: updated.employee.id,
                previousEmployeeId: appointment.employee.id,
            });

            if (updated.client.phone && updated.client.receiveNotifications) {
                const { date, time } = this.formatDate(updated.startTime);
                try {
                    await this.whatsappService.sendRescheduleNotification(
                        updated.client.phone,
                        date,
                        time,
                    );
                } catch (error) {
                    console.error(
                        'Failed to send reschedule notification',
                        error,
                    );
                }
            }
        }

        return updated;
    }

    async acceptReschedule(
        id: number,
        user: User,
    ): Promise<Appointment | null> {
        const appointment = await this.findOne(id);
        if (!appointment) return null;

        if (appointment.client.id !== user.id) {
            throw new ForbiddenException();
        }

        if (appointment.status !== AppointmentStatus.RescheduledPending) {
            throw new BadRequestException(
                'Appointment is not awaiting reschedule acceptance',
            );
        }

        await this.appointmentsRepository.update(id, {
            status: AppointmentStatus.Confirmed,
        });

        const updated = await this.findOne(id);
        if (updated) {
            await this.safeLog(user, LogAction.APPOINTMENT_RESCHEDULED, {
                action: 'accept_reschedule',
                appointmentId: updated.id,
                previousStatus: AppointmentStatus.RescheduledPending,
                status: AppointmentStatus.Confirmed,
            });
        }

        return updated;
    }

    async updateStatus(
        id: number,
        targetStatus: AppointmentStatus,
        user: User,
    ): Promise<Appointment | null> {
        const appointment = await this.findOne(id);
        if (!appointment) {
            return null;
        }

        if (targetStatus === AppointmentStatus.Cancelled) {
            return this.cancel(id, user);
        }

        if (targetStatus === AppointmentStatus.Completed) {
            return this.completeAppointment(id, user);
        }

        const terminalStatuses = [
            AppointmentStatus.Cancelled,
            AppointmentStatus.Completed,
            AppointmentStatus.NoShow,
            AppointmentStatus.InProgress,
        ];
        if (terminalStatuses.includes(appointment.status)) {
            throw new BadRequestException(
                `Cannot change status from ${appointment.status}`,
            );
        }

        const allowedTransitions: Record<
            AppointmentStatus,
            AppointmentStatus[]
        > = {
            [AppointmentStatus.Scheduled]: [
                AppointmentStatus.Confirmed,
                AppointmentStatus.InProgress,
                AppointmentStatus.NoShow,
            ],
            [AppointmentStatus.Confirmed]: [
                AppointmentStatus.InProgress,
                AppointmentStatus.NoShow,
            ],
            [AppointmentStatus.OnlinePending]: [AppointmentStatus.Confirmed],
            [AppointmentStatus.RescheduledPending]: [
                AppointmentStatus.Confirmed,
                AppointmentStatus.Cancelled,
            ],
            [AppointmentStatus.InProgress]: [],
            [AppointmentStatus.NoShow]: [],
            [AppointmentStatus.Cancelled]: [],
            [AppointmentStatus.Completed]: [],
        };

        const allowedTargets = allowedTransitions[appointment.status] ?? [];
        if (!allowedTargets.includes(targetStatus)) {
            throw new BadRequestException(
                `Cannot change status from ${appointment.status} to ${targetStatus}`,
            );
        }

        await this.appointmentsRepository.update(id, { status: targetStatus });

        const updated = await this.findOne(id);
        if (updated) {
            await this.safeLog(user, LogAction.APPOINTMENT_RESCHEDULED, {
                action: 'status_change',
                appointmentId: updated.id,
                previousStatus: appointment.status,
                status: targetStatus,
            });

            // Notify client when their online booking is confirmed by salon
            if (
                appointment.status === AppointmentStatus.OnlinePending &&
                targetStatus === AppointmentStatus.Confirmed
            ) {
                const client = updated.client;
                if (client?.phone && client.receiveNotifications) {
                    const { date, time } = this.formatDate(updated.startTime);
                    try {
                        await this.whatsappService.sendBookingConfirmation(
                            client.phone,
                            date,
                            time,
                        );
                    } catch {
                        this.logger.warn(
                            'Failed to send booking confirmed WhatsApp',
                        );
                    }
                }
            }

            // Notify client when their appointment is rescheduled by staff
            if (targetStatus === AppointmentStatus.RescheduledPending) {
                const client = updated.client;
                if (client?.phone && client.receiveNotifications) {
                    const { date, time } = this.formatDate(updated.startTime);
                    try {
                        await this.whatsappService.sendRescheduleNotification(
                            client.phone,
                            date,
                            time,
                        );
                    } catch {
                        this.logger.warn(
                            'Failed to send reschedule WhatsApp notification',
                        );
                    }
                }
            }
        }
        return updated;
    }

    async checkConflicts(
        employeeId: number,
        startTime: Date,
        endTime: Date,
        excludeId?: number,
    ): Promise<{
        hasConflict: boolean;
        conflictingAppointments: Appointment[];
    }> {
        const where: FindOptionsWhere<Appointment> = {
            employee: { id: employeeId },
            status: Not(AppointmentStatus.Cancelled),
            startTime: LessThan(endTime),
            endTime: MoreThan(startTime),
            ...(excludeId ? { id: Not(excludeId) } : {}),
        };

        const conflictingAppointments = await this.appointmentsRepository.find({
            where,
        });

        return {
            hasConflict: conflictingAppointments.length > 0,
            conflictingAppointments,
        };
    }

    /**
     * Finalize an appointment with full payment details and optional product sales.
     * This is the main checkout flow for completing a visit.
     */
    async finalizeAppointment(
        id: number,
        dto: FinalizeAppointmentDto,
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
                'Cannot finalize a cancelled appointment',
            );
        }

        // Convert cents to decimal for storage
        const paidAmount = dto.paidAmountCents / 100;
        const tipAmount = dto.tipAmountCents ? dto.tipAmountCents / 100 : 0;
        const discount = dto.discountCents ? dto.discountCents / 100 : 0;

        await this.appointmentsRepository.manager.transaction(
            async (manager) => {
                // Update appointment with finalization data
                await manager.update(Appointment, id, {
                    status: AppointmentStatus.Completed,
                    paymentMethod: dto.paymentMethod,
                    paidAmount,
                    tipAmount,
                    discount,
                    finalizedAt: new Date(),
                    finalizedBy: user,
                    internalNote: dto.note
                        ? appointment.internalNote
                            ? `${appointment.internalNote}\n${dto.note}`
                            : dto.note
                        : appointment.internalNote,
                });

                // Create commission for the service
                await this.commissionsService.createFromAppointment(
                    appointment,
                    user,
                    manager,
                );
            },
        );

        // Process product sales (upselling) after main transaction commits.
        // createSale uses its own transaction so it cannot join the outer one;
        // running it post-commit prevents partial-sale state when the outer
        // transaction rolls back.
        if (dto.products && dto.products.length > 0 && this.retailService) {
            const customerName = [
                appointment.client.firstName,
                appointment.client.lastName,
            ]
                .filter((part) => Boolean(part && part.trim()))
                .join(' ')
                .trim();
            for (const productSale of dto.products) {
                await this.retailService.createSale(
                    {
                        productId: productSale.productId,
                        quantity: productSale.quantity,
                        unitPriceCents: productSale.unitPriceCents,
                        discountCents: productSale.discountCents,
                        employeeId: appointment.employee.id,
                        appointmentId: appointment.id,
                        clientId: appointment.client.id,
                        clientName:
                            customerName.length > 0
                                ? customerName
                                : (appointment.client.name ?? null),
                    },
                    user,
                );
            }
        }

        // Deduct materials used during the service from warehouse stock
        if (dto.usageItems && dto.usageItems.length > 0 && this.retailService) {
            const clientName = [
                appointment.client.firstName,
                appointment.client.lastName,
            ]
                .filter((part) => Boolean(part && part.trim()))
                .join(' ')
                .trim();
            try {
                await this.retailService.createUsage(
                    {
                        items: dto.usageItems.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unit: item.unit,
                        })),
                        employeeId: appointment.employee.id,
                        appointmentId: appointment.id,
                        clientName:
                            clientName.length > 0
                                ? clientName
                                : appointment.client.name || undefined,
                        scope: 'completed',
                    },
                    user,
                );
            } catch (err) {
                // Non-fatal: usage deduction failure does not roll back finalization
                console.error(
                    `[finalize] usage deduction failed for appointment ${id}:`,
                    err,
                );
            }
        }

        const updated = await this.findOne(id);
        if (updated) {
            this.metrics?.incAppointmentCompleted();
            await this.safeLog(user, LogAction.APPOINTMENT_COMPLETED, {
                action: 'finalize',
                id: updated.id,
                appointmentId: updated.id,
                status: AppointmentStatus.Completed,
                paymentMethod: dto.paymentMethod,
                paidAmount,
                tipAmount,
                discount,
                productsCount: dto.products?.length ?? 0,
            });

            // Send follow-up notification
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
            }

            // Deduct materials used during treatment from warehouse
            if (
                dto.usageMaterials &&
                dto.usageMaterials.length > 0 &&
                this.retailService
            ) {
                const validItems = dto.usageMaterials
                    .filter((item) => item.quantity >= 1)
                    .map((item) => ({
                        productId: item.productId,
                        quantity: Math.round(item.quantity),
                        unit: item.unit,
                    }));
                if (validItems.length > 0) {
                    const customerName = [
                        appointment.client.firstName,
                        appointment.client.lastName,
                    ]
                        .filter((part) => Boolean(part && part.trim()))
                        .join(' ')
                        .trim();
                    try {
                        await this.retailService.createUsage(
                            {
                                items: validItems,
                                employeeId: appointment.employee.id,
                                appointmentId: appointment.id,
                                clientName:
                                    customerName.length > 0
                                        ? customerName
                                        : (appointment.client.name ??
                                          undefined),
                                scope: 'completed',
                            },
                            user,
                        );
                    } catch (error) {
                        console.warn(
                            'Failed to record material usage for appointment',
                            appointment.id,
                            error,
                        );
                    }
                }
            }
        }

        return updated;
    }

    async updateNotes(
        id: number,
        internalNote: string | null,
    ): Promise<Appointment> {
        const appointment = await this.appointmentsRepository.findOne({
            where: { id },
        });
        if (!appointment) {
            throw new BadRequestException('Appointment not found');
        }
        appointment.internalNote =
            internalNote === null ? undefined : internalNote;
        return this.appointmentsRepository.save(appointment);
    }

    async updateClientNote(
        id: number,
        notes: string | null,
    ): Promise<Appointment> {
        const appointment = await this.appointmentsRepository.findOne({
            where: { id },
        });
        if (!appointment) {
            throw new BadRequestException('Appointment not found');
        }
        const trimmed = notes?.trim();
        appointment.notes = trimmed ? trimmed : undefined;
        return this.appointmentsRepository.save(appointment);
    }

    async countOnlinePending(employeeId?: number): Promise<number> {
        const where: FindOptionsWhere<Appointment> = {
            status: AppointmentStatus.OnlinePending,
        };
        if (employeeId !== undefined) {
            where.employee = { id: employeeId };
        }
        return this.appointmentsRepository.count({ where });
    }

    async getUsageSuggestions(id: number): Promise<
        {
            productId: number;
            productName: string;
            quantity: number;
            unit: string;
        }[]
    > {
        const appointment = await this.appointmentsRepository.findOne({
            where: { id },
            relations: ['service'],
        });
        if (!appointment?.service?.id) return [];
        const items = await this.recipeItemsRepository.find({
            where: { serviceId: appointment.service.id },
            relations: ['product'],
        });
        return items
            .filter((item) => item.product && (item.quantity ?? 0) > 0)
            .map((item) => ({
                productId: item.product!.id,
                productName: item.product!.name,
                quantity: Math.max(0.01, +(item.quantity ?? 1).toFixed(2)),
                unit: item.unit ?? 'op.',
            }));
    }
}
