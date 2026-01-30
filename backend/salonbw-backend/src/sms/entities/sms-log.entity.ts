import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Appointment } from '../../appointments/appointment.entity';
import { MessageTemplate, MessageChannel } from './message-template.entity';

export enum SmsStatus {
    Pending = 'pending',
    Sent = 'sent',
    Delivered = 'delivered',
    Failed = 'failed',
    Rejected = 'rejected',
}

@Entity('sms_logs')
export class SmsLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 20 })
    recipient: string; // Phone number or email

    @Column({ type: 'enum', enum: MessageChannel, default: MessageChannel.SMS })
    channel: MessageChannel;

    @Column({ type: 'text' })
    content: string;

    @Column({ length: 200, nullable: true })
    subject: string; // For email

    @Column({ type: 'enum', enum: SmsStatus, default: SmsStatus.Pending })
    status: SmsStatus;

    @Column({ nullable: true })
    externalId: string | null; // ID from SMS provider

    @Column({ nullable: true })
    errorMessage: string | null;

    @Column({ type: 'int', default: 0 })
    partsCount: number; // Number of SMS parts

    @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
    cost: number; // Cost in PLN

    @Column({ nullable: true })
    templateId: number;

    @ManyToOne(() => MessageTemplate, { nullable: true })
    @JoinColumn({ name: 'templateId' })
    template: MessageTemplate;

    @Column({ nullable: true })
    recipientId: number;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'recipientId' })
    recipientUser: User;

    @Column({ nullable: true })
    appointmentId: number;

    @ManyToOne(() => Appointment, { nullable: true })
    @JoinColumn({ name: 'appointmentId' })
    appointment: Appointment;

    @Column({ nullable: true })
    sentById: number;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'sentById' })
    sentBy: User;

    @Column({ type: 'timestamp', nullable: true })
    sentAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    deliveredAt: Date;

    @CreateDateColumn()
    createdAt: Date;
}
