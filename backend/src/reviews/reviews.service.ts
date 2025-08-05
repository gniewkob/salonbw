import {
    Injectable,
    BadRequestException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { Review } from './review.entity';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';
import { UpdateReviewDto } from './dto/update-review.dto';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(Review)
        private readonly repo: Repository<Review>,
        @InjectRepository(Appointment)
        private readonly appointments: Repository<Appointment>,
    ) {}

    async create(dto: CreateReviewDto, userId: number) {
        const existing = await this.repo.findOne({
            where: { appointment: { id: dto.appointmentId } },
        });
        if (existing) {
            throw new ConflictException(
                'Review already exists for this appointment',
            );
        }
        const appointment = await this.appointments.findOne({
            where: { id: dto.appointmentId },
            relations: { client: true, employee: true },
        });
        if (!appointment) {
            throw new BadRequestException('Appointment not found');
        }

        if (appointment.status !== AppointmentStatus.Completed) {
            throw new BadRequestException(
                'Cannot review an incomplete appointment',
            );
        }

        if (appointment.client.id !== userId) {
            throw new ForbiddenException();
        }

        const review = this.repo.create({
            appointment: { id: dto.appointmentId } as any,
            appointmentId: dto.appointmentId,
            author: { id: appointment.client.id } as any,
            employee: { id: appointment.employee.id } as any,
            rating: dto.rating,
            comment: dto.comment,
        });
        return this.repo.save(review);
    }

    findByAppointment(appointmentId: number) {
        return this.repo.findOne({
            where: { appointment: { id: appointmentId } },
        });
    }

    async findEmployeeReviews(
        employeeId: number,
        page = 1,
        limit = 10,
        rating?: number,
    ) {
        const [data, total] = await this.repo.findAndCount({
            where: {
                employee: { id: employeeId },
                ...(rating ? { rating } : {}),
            },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total, page, limit };
    }

    findAll() {
        return this.repo.find();
    }

    findOne(id: number) {
        return this.repo.findOne({ where: { id } });
    }

    async update(id: number, dto: UpdateReviewDto) {
        await this.repo.update(
            id,
            dto as unknown as QueryDeepPartialEntity<Review>,
        );
        return this.findOne(id);
    }

    remove(id: number) {
        return this.repo.delete(id);
    }
}
