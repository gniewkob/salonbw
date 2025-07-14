import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Category } from './category.entity';

@Entity()
export class Service {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column('int')
    duration: number; // in minutes

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @Column({ type: 'float', nullable: true })
    defaultCommissionPercent: number | null;

    @ManyToOne(() => Category, (category) => category.services, { eager: true, nullable: true })
    category: Category | null;
}
