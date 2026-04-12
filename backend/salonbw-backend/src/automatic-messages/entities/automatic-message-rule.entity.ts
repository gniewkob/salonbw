import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { MessageTemplate } from '../../sms/entities/message-template.entity';

export enum AutomaticMessageTrigger {
    // Appointment-based triggers
    AppointmentReminder = 'appointment_reminder', // X hours before appointment
    AppointmentConfirmation = 'appointment_confirmation', // Immediately after booking
    AppointmentCancellation = 'appointment_cancellation', // When appointment cancelled
    FollowUp = 'follow_up', // X hours after appointment completed

    // Client-based triggers
    Birthday = 'birthday', // On client's birthday
    InactiveClient = 'inactive_client', // After X days without visit
    NewClient = 'new_client', // After first appointment
    ReviewRequest = 'review_request', // X hours after appointment for review
}

export enum MessageChannel {
    Sms = 'sms',
    Email = 'email',
    Whatsapp = 'whatsapp',
}

@Entity('automatic_message_rules')
export class AutomaticMessageRule {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({
        type: 'enum',
        enum: AutomaticMessageTrigger,
    })
    trigger: AutomaticMessageTrigger;

    @Column({
        type: 'enum',
        enum: MessageChannel,
        default: MessageChannel.Sms,
    })
    channel: MessageChannel;

    // Timing configuration (in hours, can be negative for "before" events)
    // e.g., -24 = 24 hours before, 2 = 2 hours after
    @Column({ type: 'int', default: 0 })
    offsetHours: number;

    // For inactive_client trigger: days of inactivity
    @Column({ type: 'int', nullable: true })
    inactivityDays: number | null;

    // Time window for sending (to avoid night messages)
    @Column({ type: 'time', default: '09:00:00' })
    sendWindowStart: string;

    @Column({ type: 'time', default: '20:00:00' })
    sendWindowEnd: string;

    // Template to use (optional - if null, uses content directly)
    @ManyToOne(() => MessageTemplate, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'templateId' })
    template: MessageTemplate | null;

    @Column({ type: 'int', nullable: true })
    templateId: number | null;

    // Direct content (used if no template)
    @Column({ type: 'text', nullable: true })
    content: string | null;

    // Filtering options
    @Column({ type: 'simple-array', nullable: true })
    serviceIds: number[] | null; // Only for specific services

    @Column({ type: 'simple-array', nullable: true })
    employeeIds: number[] | null; // Only for specific employees

    @Column({ default: false })
    requireSmsConsent: boolean;

    @Column({ default: false })
    requireEmailConsent: boolean;

    @Column({ default: true })
    isActive: boolean;

    // Statistics
    @Column({ type: 'int', default: 0 })
    sentCount: number;

    @Column({ type: 'timestamp', nullable: true })
    lastSentAt: Date | null;

    // Audit
    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'createdById' })
    createdBy: User | null;

    @Column({ type: 'int', nullable: true })
    createdById: number | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
