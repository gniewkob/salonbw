import {
    Injectable,
    Inject,
    forwardRef,
    ConflictException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { Service } from '../catalog/service.entity';
import { FormulasService } from '../formulas/formulas.service';
import { CommissionRecord } from '../commissions/commission-record.entity';
import { CommissionsService } from '../commissions/commissions.service';
import { Role } from '../users/role.enum';
import { EmployeeRole } from '../employees/employee-role.enum';
import { Employee } from '../employees/employee.entity';
import { UpdateAppointmentParams } from './dto/update-appointment-params';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { ClientWithPhone, EmployeeWithPhone } from './phone-interfaces';

@Injectable()
export class AppointmentsService {
    constructor(
        @InjectRepository(Appointment)
        private readonly repo: Repository<Appointment>,
        @Inject(forwardRef(() => FormulasService))
        private readonly formulas: FormulasService,
        private readonly commissions: CommissionsService,
        private readonly logs: LogsService,
        private readonly notifications: NotificationsService,
    ) {}

    async create(
        clientId: number,
        employeeId: number,
        serviceId: number,
        startTime: string,
        notes?: string,
    ): Promise<Appointment> {
        const start = new Date(startTime);
        if (start < new Date()) {
            throw new BadRequestException('Start time must be in the future');
        }
        const service = await this.repo.manager.findOne(Service, {
            where: { id: serviceId },
        });
        if (!service) {
            throw new BadRequestException('Service not found');
        }
        const endTime = new Date(start.getTime() + service.duration * 60000);
        const overlapping = await this.repo.find({
            where: [
                { employee: { id: employeeId } },
                { client: { id: clientId } },
            ],
            relations: ['service'],
        });
        for (const other of overlapping) {
            const otherEnd =
                other.endTime ||
                new Date(
                    other.startTime.getTime() +
                        other.service.duration * 60000,
                );
            if (start < otherEnd && endTime > other.startTime) {
                throw new ConflictException('Appointment time already taken');
            }
        }
        const appointment = this.repo.create({
            client: { id: clientId } as ClientWithPhone,
            employee: { id: employeeId } as EmployeeWithPhone,
            service: { id: serviceId } as Service,
            startTime: start,
            endTime,
            status: AppointmentStatus.Scheduled,
            notes,
        });
        const saved = await this.repo.save(appointment);
        await this.logs.create(
            LogAction.CreateAppointment,
            JSON.stringify({ clientId, employeeId, serviceId, startTime }),
            clientId,
        );
        if ((saved.client as ClientWithPhone)?.phone) {
            void this.notifications.sendAppointmentConfirmation(
                (saved.client as ClientWithPhone).phone!,
                saved.startTime,
            );
        }
        if ((saved.employee as EmployeeWithPhone)?.phone) {
            void this.notifications.sendNotification(
                (saved.employee as EmployeeWithPhone).phone!,
                `Nowa rezerwacja ${saved.startTime.toLocaleString()}`,
                'whatsapp',
            );
        }
        return saved;
    }

    findClientAppointments(clientId: number) {
        return this.repo.find({ where: { client: { id: clientId } } });
    }

    findEmployeeAppointments(employeeId: number) {
        return this.repo.find({ where: { employee: { id: employeeId } } });
    }

    findAll() {
        return this.repo.find();
    }

    findOne(id: number) {
        return this.repo.findOne({ where: { id } });
    }

    async update(id: number, dto: UpdateAppointmentParams) {
        const appt = await this.repo.findOne({ where: { id } });
        if (!appt) {
            return undefined;
        }
        return this.applyUpdates(appt, dto);
    }

    private async applyUpdates(
        appt: Appointment,
        dto: UpdateAppointmentParams,
    ) {
        const employeeId = dto.employeeId ?? appt.employee.id;
        let start = appt.startTime;
        let service = appt.service;
        let endTime =
            appt.endTime ||
            new Date(appt.startTime.getTime() + appt.service.duration * 60000);
        let needsCheck = false;

        if (dto.startTime) {
            const newStart = new Date(dto.startTime);
            if (newStart < new Date()) {
                throw new BadRequestException(
                    'Start time must be in the future',
                );
            }
            start = newStart;
            needsCheck = true;
        }
        if (dto.serviceId) {
            const found = await this.repo.manager.findOne(Service, {
                where: { id: dto.serviceId },
            });
            if (found) {
                service = found;
            }
            needsCheck = true;
        }
        if (dto.endTime) {
            endTime = new Date(dto.endTime);
            needsCheck = true;
        } else if (dto.startTime || dto.serviceId) {
            endTime = new Date(start.getTime() + service.duration * 60000);
            needsCheck = true;
        }

        if (needsCheck) {
            const existing = await this.repo.find({
                where: [
                    { employee: { id: employeeId } },
                    { client: { id: appt.client.id } },
                ],
                relations: ['service'],
            });
            for (const other of existing) {
                if (other.id === appt.id) continue;
                const otherEnd =
                    other.endTime ||
                    new Date(
                        other.startTime.getTime() +
                            other.service.duration * 60000,
                    );
                if (start < otherEnd && endTime > other.startTime) {
                    throw new ConflictException(
                        'Appointment time already taken',
                    );
                }
            }
        }

        if (dto.startTime) {
            appt.startTime = start;
        }
        if (dto.endTime) {
            appt.endTime = endTime;
        } else if (dto.startTime || dto.serviceId) {
            appt.endTime = endTime;
        }
        if (dto.notes !== undefined) {
            appt.notes = dto.notes;
        }
        if (dto.serviceId) {
            appt.service = { id: dto.serviceId } as Service;
        }
        if (dto.employeeId) {
            appt.employee = { id: dto.employeeId } as unknown as Employee;
        }
        if (dto.status) {
            appt.status = dto.status;
        }
        const saved = await this.repo.save(appt);
        if (dto.formulaDescription) {
            await this.formulas.create(
                appt.client.id,
                dto.formulaDescription,
                appt.id,
            );
        }
        return saved;
    }

    async complete(
        id: number,
    ): Promise<
        | { appointment: Appointment; commission: CommissionRecord | null }
        | undefined
    >;
    async complete(
        id: number,
        userId: number,
        role: Role | EmployeeRole,
    ): Promise<
        | { appointment: Appointment; commission: CommissionRecord | null }
        | undefined
    >;
    async complete(id: number, userId?: number, role?: Role | EmployeeRole) {
        const appt = await this.repo.findOne({ where: { id } });
        if (!appt) {
            return undefined;
        }
        if (userId === undefined || role === undefined) {
            appt.status = AppointmentStatus.Completed;
            appt.endTime = new Date();
            const saved = await this.repo.save(appt);
            const record = await this.commissions.calculateCommission(saved.id);
            await this.logs.create(
                LogAction.CompleteAppointment,
                JSON.stringify({
                    appointmentId: saved.id,
                    commissionAmount: record?.amount ?? 0,
                    percent: record?.percent ?? 0,
                }),
            );
            if ((saved.client as ClientWithPhone)?.phone) {
                void this.notifications.sendThankYou(
                    (saved.client as ClientWithPhone).phone!,
                );
            }
            return { appointment: saved, commission: record };
        }
        if (appt.status === AppointmentStatus.Completed) {
            return { appointment: appt, commission: null };
        }
        if (
            role !== Role.Admin &&
            (role !== Role.Employee || appt.employee.id !== userId)
        ) {
            throw new ForbiddenException();
        }
        appt.status = AppointmentStatus.Completed;
        appt.endTime = appt.endTime || new Date();
        const saved = await this.repo.save(appt);

        const record = await this.commissions.calculateCommission(saved.id);
        await this.logs.create(
            LogAction.CompleteAppointment,
            JSON.stringify({
                appointmentId: saved.id,
                commissionAmount: record?.amount ?? 0,
                percent: record?.percent ?? 0,
            }),
            userId,
        );
        if ((saved.client as ClientWithPhone)?.phone) {
            void this.notifications.sendThankYou(
                (saved.client as ClientWithPhone).phone!,
            );
        }
        return { appointment: saved, commission: record };
    }

    async remove(id: number) {
        const result = await this.repo.delete(id);
        await this.logs.create(
            LogAction.DeleteAppointment,
            JSON.stringify({ appointmentId: id }),
        );
        return result;
    }

    async updateForUser(
        id: number,
        userId: number,
        role: Role | EmployeeRole,
        dto: UpdateAppointmentParams,
    ) {
        const appt = await this.repo.findOne({ where: { id } });
        if (!appt) {
            return undefined;
        }
        if (
            (role === Role.Client && appt.client.id !== userId) ||
            (role === Role.Employee && appt.employee.id !== userId)
        ) {
            throw new ForbiddenException();
        }
        return this.applyUpdates(appt, dto);
    }

    async noShow(id: number, userId: number, role: Role | EmployeeRole) {
        const appt = await this.repo.findOne({ where: { id } });
        if (!appt) {
            return undefined;
        }
        if (
            role !== Role.Admin &&
            (role !== Role.Employee || appt.employee.id !== userId)
        ) {
            throw new ForbiddenException();
        }
        appt.status = AppointmentStatus.NO_SHOW;
        const saved = await this.repo.save(appt);
        await this.logs.create(
            LogAction.NoShowAppointment,
            JSON.stringify({ appointmentId: id, userId }),
            userId,
        );
        return saved;
    }

    async cancel(id: number, userId: number, role: Role | EmployeeRole) {
        const appt = await this.repo.findOne({ where: { id } });
        if (!appt) {
            return undefined;
        }
        if (
            role !== Role.Admin &&
            appt.client.id !== userId &&
            appt.employee.id !== userId
        ) {
            throw new ForbiddenException();
        }
        appt.status = AppointmentStatus.Cancelled;
        const saved = await this.repo.save(appt);
        await this.logs.create(
            LogAction.CancelAppointment,
            JSON.stringify({ appointmentId: id, userId }),
            userId,
        );
        return saved;
    }

    async removeForUser(id: number, userId: number, role: Role | EmployeeRole) {
        const appt = await this.repo.findOne({ where: { id } });
        if (!appt) {
            return undefined;
        }
        if (
            (role === Role.Client && appt.client.id !== userId) ||
            (role === Role.Employee && appt.employee.id !== userId)
        ) {
            throw new ForbiddenException();
        }
        const result = await this.repo.delete(id);
        await this.logs.create(
            LogAction.DeleteAppointment,
            JSON.stringify({ appointmentId: id, userId }),
            userId,
        );
        return result;
    }
}
