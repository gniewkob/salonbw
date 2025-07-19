import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

export enum EmailStatus {
    Pending = 'pending',
    Sent = 'sent',
    Failed = 'failed',
    Skipped = 'skipped',
}

@Entity()
export class EmailLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    recipient: string;

    @Column()
    subject: string;

    @Column('text')
    html: string;

    @Column({ type: 'simple-enum', enum: EmailStatus })
    status: EmailStatus;

    @Column({ nullable: true })
    error: string | null;

    @CreateDateColumn()
    sentAt: Date;

    @Column()
    token: string;
}
