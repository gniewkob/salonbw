import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Timetable } from './timetable.entity';
import { User } from '../../users/user.entity';

export enum ExceptionType {
    DayOff = 'day_off',
    Holiday = 'holiday',
    Vacation = 'vacation',
    SickLeave = 'sick_leave',
    Training = 'training',
    CustomHours = 'custom_hours',
    Other = 'other',
}

/**
 * Represents an exception/override to the regular timetable.
 * Can be a day off, vacation, or custom working hours for a specific date.
 */
@Entity('timetable_exceptions')
export class TimetableException {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    timetableId: number;

    @ManyToOne(() => Timetable, (timetable) => timetable.exceptions, {
        onDelete: 'CASCADE',
    })
    timetable: Timetable;

    @Column({ type: 'date' })
    date: Date;

    @Column({
        type: 'simple-enum',
        enum: ExceptionType,
        default: ExceptionType.DayOff,
    })
    type: ExceptionType;

    @Column({ length: 200, nullable: true })
    title?: string;

    @Column({ type: 'text', nullable: true })
    reason?: string;

    @Column({ type: 'time', nullable: true })
    customStartTime?: string;

    @Column({ type: 'time', nullable: true })
    customEndTime?: string;

    @Column({ default: false })
    isAllDay: boolean;

    @Column({ nullable: true })
    createdById?: number;

    @ManyToOne(() => User, { nullable: true })
    createdBy?: User;

    @Column({ nullable: true })
    approvedById?: number;

    @ManyToOne(() => User, { nullable: true })
    approvedBy?: User;

    @Column({ nullable: true })
    approvedAt?: Date;

    @Column({ default: false })
    isPending: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
