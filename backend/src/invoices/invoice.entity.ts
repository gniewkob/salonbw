import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';

@Entity()
export class Invoice {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    reservationId: number;

    @ManyToOne(() => Appointment, { onDelete: 'RESTRICT' })
    reservation: Appointment;

    @Column()
    number: string;

    @Column()
    pdfUrl: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ default: 'issued' })
    status: string;
}
