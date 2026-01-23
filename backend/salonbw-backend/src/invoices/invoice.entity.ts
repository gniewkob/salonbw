import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';

export enum InvoiceStatus {
    Draft = 'draft',
    Sent = 'sent',
    Paid = 'paid',
    Cancelled = 'cancelled',
}

@Entity('invoices')
export class Invoice {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    number: string;

    @ManyToOne(() => User, { eager: true })
    client: User;

    @ManyToOne(() => Appointment, { eager: true, nullable: true })
    appointment: Appointment | null;

    @Column('decimal', { precision: 10, scale: 2 })
    amount: number;

    @Column({
        type: 'simple-enum',
        enum: InvoiceStatus,
        default: InvoiceStatus.Draft,
    })
    status: InvoiceStatus;

    @Column({ nullable: true })
    notes?: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ nullable: true })
    paidAt?: Date;
}
