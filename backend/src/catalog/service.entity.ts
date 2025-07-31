import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { Category } from './category.entity';

@Index(['category', 'name'], { unique: true })
@Entity()
export class Service {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column('text', { nullable: true })
    description: string | null;

    @Column('int')
    duration: number; // in minutes

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @Column({ type: 'float', nullable: true })
    defaultCommissionPercent: number | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Category, (category) => category.services, {
        eager: true,
        nullable: true,
        onDelete: 'SET NULL',
    })
    category: Category | null;
}
