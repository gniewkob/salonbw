import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Service } from '../services/service.entity';
import { Formula } from '../formulas/formula.entity';
import { ServiceVariant } from '../services/entities/service-variant.entity';

export enum AppointmentStatus {
    Scheduled = 'scheduled',
    Confirmed = 'confirmed',
    InProgress = 'in_progress',
    Cancelled = 'cancelled',
    Completed = 'completed',
    NoShow = 'no_show',
}

export enum PaymentMethod {
    Cash = 'cash',
    Card = 'card',
    Transfer = 'transfer',
    Online = 'online',
    Voucher = 'voucher',
}

@Entity('appointments')
@Index('idx_appointments_calendar', ['startTime', 'endTime', 'employeeId'])
@Index('idx_appointments_client', ['clientId', 'startTime'])
@Index('idx_appointments_employee', ['employeeId', 'startTime'])
@Index('idx_appointments_status', ['status'])
export class Appointment {
    @PrimaryGeneratedColumn()
    id: number;

    // Explicit foreign key columns for better query control
    @Column()
    clientId: number;

    @Column()
    employeeId: number;

    @Column()
    serviceId: number;

    @Column({ nullable: true })
    serviceVariantId?: number | null;

    // Relations - NO eager loading, use explicit joins when needed
    @ManyToOne(() => User)
    @JoinColumn({ name: 'clientId' })
    client: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'employeeId' })
    employee: User;

    @ManyToOne(() => Service)
    @JoinColumn({ name: 'serviceId' })
    service: Service;

    @ManyToOne(() => ServiceVariant, { nullable: true })
    @JoinColumn({ name: 'serviceVariantId' })
    serviceVariant?: ServiceVariant | null;

    @Column()
    startTime: Date;

    @Column()
    endTime: Date;

    @Column({
        type: 'simple-enum',
        enum: AppointmentStatus,
        default: AppointmentStatus.Scheduled,
    })
    status: AppointmentStatus;

    @Column({ nullable: true })
    notes?: string;

    @Column({ nullable: true, type: 'text' })
    internalNote?: string;

    @Column({ default: false })
    reservedOnline: boolean;

    @Column({ default: false })
    reminderSent: boolean;

    @Column({ nullable: true })
    reminderSentAt?: Date;

    @Column({ type: 'simple-array', nullable: true })
    tags?: string[];

    @Column({
        type: 'simple-enum',
        enum: PaymentMethod,
        nullable: true,
    })
    paymentMethod?: PaymentMethod;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    paidAmount?: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    tipAmount?: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    discount?: number;

    @Index('idx_appointments_finalized')
    @Column({ nullable: true })
    finalizedAt?: Date;

    @ManyToOne(() => User, { nullable: true })
    finalizedBy?: User;

    @Column({ nullable: true })
    cancelledAt?: Date;

    @Column({ nullable: true })
    cancellationReason?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Formula, (f) => f.appointment)
    formulas: Formula[];
}
