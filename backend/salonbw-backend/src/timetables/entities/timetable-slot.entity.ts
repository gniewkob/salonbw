import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from 'typeorm';
import { Timetable } from './timetable.entity';

/**
 * Day of week enumeration (0 = Monday, 6 = Sunday)
 * Using ISO standard where Monday is first day of week
 */
export enum DayOfWeek {
    Monday = 0,
    Tuesday = 1,
    Wednesday = 2,
    Thursday = 3,
    Friday = 4,
    Saturday = 5,
    Sunday = 6,
}

/**
 * Represents a single time slot within a weekly timetable.
 * E.g., "Monday 9:00 - 17:00" or "Tuesday 10:00 - 14:00, 16:00 - 20:00"
 */
@Entity('timetable_slots')
export class TimetableSlot {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    timetableId: number;

    @ManyToOne(() => Timetable, (timetable) => timetable.slots, {
        onDelete: 'CASCADE',
    })
    timetable: Timetable;

    @Column({
        type: 'smallint',
        comment: '0=Monday, 6=Sunday (ISO week)',
    })
    dayOfWeek: DayOfWeek;

    @Column({ type: 'time' })
    startTime: string;

    @Column({ type: 'time' })
    endTime: string;

    @Column({ default: false })
    isBreak: boolean;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @CreateDateColumn()
    createdAt: Date;
}
