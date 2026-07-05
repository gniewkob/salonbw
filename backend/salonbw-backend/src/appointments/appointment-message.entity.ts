import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Appointment } from './appointment.entity';

/**
 * One message in a per-appointment two-way thread between the client and the
 * salon. authorRole distinguishes who wrote it (client vs any staff role) so
 * the UI can style bubbles and the "new salon message" banner can fire.
 */
@Entity('appointment_messages')
@Index('idx_appointment_messages_appointment', ['appointmentId'])
export class AppointmentMessage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    appointmentId: number;

    @ManyToOne(() => Appointment, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'appointmentId' })
    appointment: Appointment;

    @Column({ nullable: true })
    authorId: number | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'authorId' })
    author: User | null;

    /** 'client' | 'employee' | 'receptionist' | 'admin' */
    @Column({ length: 20 })
    authorRole: string;

    @Column({ type: 'text' })
    body: string;

    @CreateDateColumn()
    createdAt: Date;
}
