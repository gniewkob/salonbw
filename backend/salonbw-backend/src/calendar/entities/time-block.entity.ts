import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

export enum TimeBlockType {
    Break = 'break',
    Vacation = 'vacation',
    Training = 'training',
    Sick = 'sick',
    Other = 'other',
}

@Entity('time_blocks')
export class TimeBlock {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { eager: true })
    employee: User;

    @Column()
    startTime: Date;

    @Column()
    endTime: Date;

    @Column({
        type: 'simple-enum',
        enum: TimeBlockType,
        default: TimeBlockType.Break,
    })
    type: TimeBlockType;

    @Column({ nullable: true })
    title?: string;

    @Column({ nullable: true, type: 'text' })
    notes?: string;

    @Column({ default: false })
    allDay: boolean;

    @Column({ default: false })
    recurring: boolean;

    @Column({ nullable: true })
    recurringPattern?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
