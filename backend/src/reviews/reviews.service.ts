import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { UpdateReviewDto } from './dto/update-review.dto';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(Review)
        private readonly repo: Repository<Review>,
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
        const review = this.repo.create({
            reservation: { id: dto.reservationId } as any,
            reservationId: dto.reservationId,
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
        await this.repo.update(id, dto as any);
        return this.findOne(id);
    }

    remove(id: number) {
        return this.repo.delete(id);
    }
}
