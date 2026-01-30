import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Newsletter } from './newsletter.entity';

export enum RecipientStatus {
    Pending = 'pending',
    Sent = 'sent',
    Delivered = 'delivered',
    Opened = 'opened',
    Clicked = 'clicked',
    Bounced = 'bounced',
    Failed = 'failed',
    Unsubscribed = 'unsubscribed',
}

@Entity('newsletter_recipients')
@Index(['newsletterId', 'recipientId'], { unique: true })
export class NewsletterRecipient {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Newsletter, (newsletter) => newsletter.recipients, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'newsletterId' })
    newsletter: Newsletter;

    @Column()
    newsletterId: number;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'recipientId' })
    recipient: User | null;

    @Column({ nullable: true })
    recipientId: number | null;

    // Store recipient email/phone at send time (in case user is deleted later)
    @Column({ length: 255 })
    recipientEmail: string;

    @Column({ length: 100, nullable: true })
    recipientName: string | null;

    @Column({
        type: 'varchar',
        length: 20,
        default: RecipientStatus.Pending,
    })
    status: RecipientStatus;

    @Column({ type: 'timestamp', nullable: true })
    sentAt: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    deliveredAt: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    openedAt: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    clickedAt: Date | null;

    @Column({ type: 'text', nullable: true })
    errorMessage: string | null;

    // External tracking ID from email service
    @Column({ length: 255, nullable: true })
    externalId: string | null;

    @CreateDateColumn()
    createdAt: Date;
}
