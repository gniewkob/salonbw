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
    OnlinePending = 'online_pending',
    RescheduledPending = 'rescheduled_pending',
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

    @Column({ nullable: true, type: 'text' })
    notes?: string | null;

    @Column({ nullable: true, type: 'text' })
    clientComment?: string | null;

    @Column({ nullable: true, type: 'text' })
    staffRecommendations?: string | null;

    @Column({ nullable: true, type: 'text' })
    onlineAddonsSummary?: string | null;

    @Column({ nullable: true, type: 'int' })
    onlineTotalDurationMinutes?: number | null;

    @Column({ default: false })
    onlineDurationNeedsVerification: boolean;

    @Column({ nullable: true, type: 'text' })
    internalNote?: string;

    // Additional services billed at finalization (beyond the primary service),
    // e.g. an extra care/treatment added during the visit. Line-items with
    // their own per-item discount; they contribute to the visit total and the
    // (single, combined) commission. Stored denormalized so history is stable
    // even if the catalog price later changes.
    @Column({ type: 'jsonb', nullable: true })
    extraServices?: Array<{
        serviceId: number;
        name: string;
        priceCents: number;
        discountCents: number;
    }>;

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

    @Column({ type: 'timestamp', nullable: true })
    reschedulePreviousStartTime?: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    reschedulePreviousEndTime?: Date | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Formula, (f) => f.appointment)
    formulas: Formula[];
}
