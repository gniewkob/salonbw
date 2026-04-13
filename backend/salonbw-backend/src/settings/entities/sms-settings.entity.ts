import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum SmsType {
    Standard = 'standard',
    Premium = 'premium',
}

@Entity('sms_settings')
export class SmsSettings {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        name: 'sms_type',
        type: 'enum',
        enum: SmsType,
        default: SmsType.Standard,
    })
    smsType: SmsType;

    @Column({ name: 'send_abroad', default: false })
    sendAbroad: boolean;

    @Column({ name: 'utf', default: true })
    utf: boolean;

    @Column({
        name: 'default_prefix',
        type: 'varchar',
        length: 64,
        default: '+48 (Polska)',
    })
    defaultPrefix: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
