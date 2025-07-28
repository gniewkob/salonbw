import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Review } from './review.entity';
import { Appointment } from '../appointments/appointment.entity';
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

    async create(dto: CreateReviewDto) {
        const existing = await this.repo.findOne({
            where: { reservation: { id: dto.reservationId } },
        });
        if (existing) {
            throw new BadRequestException(
                'Review already exists for this reservation',
            );
        }
        const appointment = await this.appointments.findOne({
            where: { id: dto.reservationId },
            relations: { client: true },
        });
        if (!appointment) {
            throw new BadRequestException('Reservation not found');
        }

        const review = this.repo.create({
            reservation: appointment,
            reservationId: dto.reservationId,
            client: appointment.client,
            rating: dto.rating,
            comment: dto.comment,
        });
        return this.repo.save(review);
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
