import {
    Injectable,
    BadRequestException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { User } from '../users/user.entity';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';

interface CreateReviewData {
    client: User;
    employee: User;
    appointment?: Appointment;
    rating: number;
    comment?: string;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(Review)
        private readonly reviewRepository: Repository<Review>,
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
    ) {}

    /**
     * Client rates a visit: the appointment must belong to the client, be
     * completed, and not be reviewed yet. The reviewed employee is derived
     * from the appointment (never trusted from the request body).
     */
    async createForAppointment(
        clientId: number,
        appointmentId: number,
        rating: number,
        comment?: string,
    ): Promise<Review> {
        const appointment = await this.appointmentRepository.findOne({
            where: { id: appointmentId },
            relations: ['client', 'employee'],
        });
        if (!appointment) {
            throw new NotFoundException('Appointment not found');
        }
        if (appointment.client?.id !== clientId) {
            throw new ForbiddenException(
                'You can only review your own appointments',
            );
        }
        if (appointment.status !== AppointmentStatus.Completed) {
            throw new BadRequestException(
                'Only completed appointments can be reviewed',
            );
        }
        const existing = await this.reviewRepository.findOne({
            where: {
                appointment: { id: appointmentId },
                client: { id: clientId },
            },
        });
        if (existing) {
            throw new BadRequestException(
                'This appointment has already been reviewed',
            );
        }
        const review = this.reviewRepository.create({
            client: { id: clientId } as User,
            employee: { id: appointment.employee.id } as User,
            appointment,
            rating,
            comment,
        });
        return this.reviewRepository.save(review);
    }

    async findAll(page = 1, limit = 10): Promise<PaginatedResult<Review>> {
        const [data, total] = await this.reviewRepository.findAndCount({
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total, page, limit };
    }

    async findForEmployee(
        employeeId: number,
        page = 1,
        limit = 10,
    ): Promise<PaginatedResult<Review>> {
        const [data, total] = await this.reviewRepository.findAndCount({
            where: { employee: { id: employeeId } },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total, page, limit };
    }

    async findForClient(
        clientId: number,
        page = 1,
        limit = 10,
    ): Promise<PaginatedResult<Review>> {
        const [data, total] = await this.reviewRepository.findAndCount({
            where: { client: { id: clientId } },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total, page, limit };
    }

    async findOne(id: number): Promise<Review | null> {
        return this.reviewRepository.findOne({ where: { id } });
    }

    async create(data: CreateReviewData): Promise<Review> {
        const review = this.reviewRepository.create(data);
        return this.reviewRepository.save(review);
    }

    async getAverageRating(employeeId: number): Promise<number | null> {
        const result = await this.reviewRepository
            .createQueryBuilder('review')
            .select('AVG(review.rating)', 'avg')
            .where('review.employeeId = :employeeId', { employeeId })
            .getRawOne();
        return result?.avg ? parseFloat(result.avg) : null;
    }

    async delete(id: number): Promise<void> {
        await this.reviewRepository.delete(id);
    }
}
