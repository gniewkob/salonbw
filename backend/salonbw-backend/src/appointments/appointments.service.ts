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
    ) {}

    async create(data: Partial<Appointment>): Promise<Appointment> {
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

    async cancel(id: number): Promise<Appointment | null> {
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
        return this.findOne(id);
    }

    async completeAppointment(id: number): Promise<Appointment | null> {
        const appointment = await this.findOne(id);
        if (!appointment) {
            return null;
        }
        if (appointment.status === AppointmentStatus.Cancelled) {
            throw new BadRequestException(
                'Cannot complete a cancelled appointment',
            );
        }
        await this.appointmentsRepository.update(id, {
            status: AppointmentStatus.Completed,
        });
        await this.commissionsService.createFromAppointment(appointment);
        return this.findOne(id);
    }
}
