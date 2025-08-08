import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    Check,
} from 'typeorm';
import { Category } from './category.entity';

@Index(['category', 'name'], { unique: true })
@Check('"defaultCommissionPercent" >= 0 AND "defaultCommissionPercent" <= 100')
@Check('"price" >= 0')
@Check('"duration" > 0')
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

    @CreateDateColumn({
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP',
    })
    createdAt: Date;

    @UpdateDateColumn({
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    })
    updatedAt: Date;

    @ManyToOne(() => Category, (category) => category.services, {
        eager: true,
        nullable: true,
        onDelete: 'SET NULL',
    })
    category: Category | null;
}
