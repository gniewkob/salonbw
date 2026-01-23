import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { User } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';

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
    ) {}

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
