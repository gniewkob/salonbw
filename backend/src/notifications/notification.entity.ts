import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

export enum NotificationChannel {
    Sms = 'sms',
    Whatsapp = 'whatsapp',
}

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
