import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum TemplateType {
    AppointmentReminder = 'appointment_reminder',
    AppointmentConfirmation = 'appointment_confirmation',
    AppointmentCancellation = 'appointment_cancellation',
    BirthdayWish = 'birthday_wish',
    FollowUp = 'follow_up',
    Marketing = 'marketing',
    Custom = 'custom',
}

export enum MessageChannel {
    SMS = 'sms',
    Email = 'email',
    WhatsApp = 'whatsapp',
}

@Entity('message_templates')
export class MessageTemplate {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    name: string;

    @Column({ type: 'enum', enum: TemplateType, default: TemplateType.Custom })
    type: TemplateType;

    @Column({ type: 'enum', enum: MessageChannel, default: MessageChannel.SMS })
    channel: MessageChannel;

    @Column({ type: 'text' })
    content: string;

    @Column({ length: 200, nullable: true })
    subject: string; // For email templates

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false })
    isDefault: boolean; // Default template for type

    // Variables available: {{client_name}}, {{service_name}}, {{date}}, {{time}}, {{employee_name}}, {{salon_name}}, {{salon_phone}}
    @Column({ type: 'simple-array', nullable: true })
    availableVariables: string[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
