import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from 'typeorm';
import { Service } from '../service.entity';

export enum ServiceReviewSource {
    Booksy = 'booksy',
    Moment = 'moment',
    Internal = 'internal',
}

@Entity('service_reviews')
export class ServiceReview {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Service, (service) => service.reviews, {
        onDelete: 'CASCADE',
    })
    service: Service;

    @Column()
    serviceId: number;

    @Column({
        type: 'simple-enum',
        enum: ServiceReviewSource,
        default: ServiceReviewSource.Internal,
    })
    source: ServiceReviewSource;

    @Column('int')
    rating: number;

    @Column({ type: 'text', nullable: true })
    comment?: string | null;

    @Column({ type: 'varchar', length: 200, nullable: true })
    authorName?: string | null;

    @CreateDateColumn()
    createdAt: Date;
}
