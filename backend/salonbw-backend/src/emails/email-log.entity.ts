import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum EmailLogStatus {
    Pending = 'pending',
    Sent = 'sent',
    Failed = 'failed',
}

@Entity('email_logs')
export class EmailLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    to: string;

    @Column({ type: 'varchar', length: 255 })
    subject: string;

    @Column({ type: 'text' })
    template: string;

    @Column({ type: 'jsonb', nullable: true })
    data: Record<string, string> | null;

    @Column({
        type: 'enum',
        enum: EmailLogStatus,
        default: EmailLogStatus.Pending,
    })
    status: EmailLogStatus;

    @Column({ type: 'text', nullable: true })
    errorMessage: string | null;

    @Column({ type: 'int', nullable: true })
    recipientId: number | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'recipientId' })
    recipientUser: User | null;

    @Column({ type: 'int', nullable: true })
    sentById: number | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'sentById' })
    sentBy: User | null;

    @Column({ type: 'timestamp', nullable: true })
    sentAt: Date | null;

    @CreateDateColumn()
    createdAt: Date;
}
