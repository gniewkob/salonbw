import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Service } from '../services/service.entity';

export enum AppointmentStatus {
    Scheduled = 'scheduled',
    Cancelled = 'cancelled',
    Completed = 'completed',
}

@Entity('appointments')
export class Appointment {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { eager: true })
    client: User;

    @ManyToOne(() => User, { eager: true })
    employee: User;

    @ManyToOne(() => Service, { eager: true })
    service: Service;

    @Column()
    startTime: Date;

    @Column()
    endTime: Date;

    @Column({ type: 'simple-enum', enum: AppointmentStatus, default: AppointmentStatus.Scheduled })
    status: AppointmentStatus;

    @Column({ nullable: true })
    notes?: string;
}
