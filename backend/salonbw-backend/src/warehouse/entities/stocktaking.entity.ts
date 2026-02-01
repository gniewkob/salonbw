import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { StocktakingItem } from './stocktaking-item.entity';

export enum StocktakingStatus {
    Draft = 'draft',
    InProgress = 'in_progress',
    Completed = 'completed',
    Cancelled = 'cancelled',
}

@Entity('stocktakings')
export class Stocktaking {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 50, unique: true })
    stocktakingNumber: string;

    @Column({
        type: 'varchar',
        length: 20,
        default: StocktakingStatus.Draft,
    })
    status: StocktakingStatus;

    @Column({ type: 'date' })
    stocktakingDate: Date;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'createdById' })
    createdBy: User | null;

    @Column({ type: 'int', nullable: true })
    createdById: number | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'completedById' })
    completedBy: User | null;

    @Column({ type: 'int', nullable: true })
    completedById: number | null;

    @Column({ type: 'timestamp', nullable: true })
    completedAt: Date | null;

    @OneToMany(() => StocktakingItem, (item) => item.stocktaking, {
        cascade: true,
    })
    items: StocktakingItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
