import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { NewsletterRecipient } from './newsletter-recipient.entity';

export enum NewsletterStatus {
    Draft = 'draft',
    Scheduled = 'scheduled',
    Sending = 'sending',
    Sent = 'sent',
    PartialFailure = 'partial_failure',
    Failed = 'failed',
    Cancelled = 'cancelled',
}

export enum NewsletterChannel {
    Email = 'email',
    Sms = 'sms',
}

@Entity('newsletters')
export class Newsletter {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 200 })
    name: string;

    @Column({ length: 200 })
    subject: string;

    @Column('text')
    content: string;

    @Column('text', { nullable: true })
    plainTextContent: string | null;

    @Column({
        type: 'varchar',
        length: 20,
        default: NewsletterChannel.Email,
    })
    channel: NewsletterChannel;

    @Column({
        type: 'varchar',
        length: 20,
        default: NewsletterStatus.Draft,
    })
    status: NewsletterStatus;

    @Column({ type: 'timestamp', nullable: true })
    scheduledAt: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    sentAt: Date | null;

    @Column({ default: 0 })
    totalRecipients: number;

    @Column({ default: 0 })
    sentCount: number;

    @Column({ default: 0 })
    deliveredCount: number;

    @Column({ default: 0 })
    failedCount: number;

    @Column({ default: 0 })
    openedCount: number;

    @Column({ default: 0 })
    clickedCount: number;

    // Filter criteria for recipients (stored as JSON)
    @Column('text', { nullable: true })
    recipientFilter: string | null;

    // Specific recipient IDs if manually selected
    @Column('text', { nullable: true })
    recipientIds: string | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'createdById' })
    createdBy: User | null;

    @Column({ type: 'int', nullable: true })
    createdById: number | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'sentById' })
    sentBy: User | null;

    @Column({ type: 'int', nullable: true })
    sentById: number | null;

    @OneToMany(() => NewsletterRecipient, (recipient) => recipient.newsletter)
    recipients: NewsletterRecipient[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
