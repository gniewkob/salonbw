import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { TimetableSlot } from './timetable-slot.entity';
import { TimetableException } from './timetable-exception.entity';

/**
 * Represents a recurring weekly work schedule for an employee.
 * Each employee can have one active timetable at a time.
 */
@Entity('timetables')
export class Timetable {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    employeeId: number;

    @ManyToOne(() => User, { eager: true })
    employee: User;

    @Column({ length: 100 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'date' })
    validFrom: Date;

    @Column({ type: 'date', nullable: true })
    validTo?: Date;

    @Column({ default: true })
    isActive: boolean;

    @OneToMany(() => TimetableSlot, (slot) => slot.timetable, {
        cascade: true,
        eager: true,
    })
    slots: TimetableSlot[];

    @OneToMany(() => TimetableException, (exception) => exception.timetable, {
        cascade: true,
    })
    exceptions: TimetableException[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
