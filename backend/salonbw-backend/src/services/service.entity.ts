import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('services')
export class Service {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column('int')
    duration: number;

    @Column('decimal')
    price: number;

    @Column({ nullable: true })
    category?: string;

    @Column('decimal', { nullable: true })
    commissionPercent?: number;
}
