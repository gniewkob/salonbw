import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
} from 'typeorm';
import { Notification, NotificationStatus } from './notification.entity';
import { NotificationChannel } from './notification-channel.enum';

@Entity()
export class NotificationLog {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Notification, (notification) => notification.logs, {
        onDelete: 'CASCADE',
    })
    notification: Notification;

    @Column()
    recipient: string;

    @Column({ type: 'simple-enum', enum: NotificationChannel })
    type: NotificationChannel;

    @Column({ type: 'simple-enum', enum: NotificationStatus })
    status: NotificationStatus;

    @CreateDateColumn()
    timestamp: Date;

    @Column('text', { nullable: true })
    error?: string;
}
