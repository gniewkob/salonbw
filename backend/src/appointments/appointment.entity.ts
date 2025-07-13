import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { User } from '../users/user.entity';

export enum AppointmentStatus {
    Scheduled = 'scheduled',
    Completed = 'completed',
    Cancelled = 'cancelled',
}

@Entity()
export class Appointment {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { eager: true })
    client: User;

    @ManyToOne(() => User, { eager: true })
    employee: User;

    @Column()
    scheduledAt: Date;

    @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.Scheduled })
    status: AppointmentStatus;
}
