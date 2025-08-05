import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';
import { NotificationChannel } from './notification-channel.enum';

export enum NotificationStatus {
    Pending = 'pending',
    Sent = 'sent',
    Failed = 'failed',
}

@Entity()
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    recipient: string;

    @Column({ type: 'simple-enum', enum: NotificationChannel })
    type: NotificationChannel;

    @Column('text')
    message: string;

    @Column({ type: 'simple-enum', enum: NotificationStatus })
    status: NotificationStatus;

    @CreateDateColumn()
    sentAt: Date;
}
