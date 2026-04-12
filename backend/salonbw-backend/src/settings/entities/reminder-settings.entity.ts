import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum ReminderChannel {
    Sms = 'sms',
    Email = 'email',
    Both = 'both',
}

@Entity('reminder_settings')
export class ReminderSettings {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'active', default: true })
    active: boolean;

    @Column({ name: 'timing_hours', default: 24 })
    timingHours: number;

    @Column({
        name: 'preferred_channel',
        type: 'simple-enum',
        enum: ReminderChannel,
        default: ReminderChannel.Sms,
    })
    preferredChannel: ReminderChannel;

    @Column({ name: 'sms_template', type: 'text', nullable: true })
    smsTemplate: string | null;

    @Column({
        name: 'email_subject',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    emailSubject: string | null;

    @Column({ name: 'email_template', type: 'text', nullable: true })
    emailTemplate: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
