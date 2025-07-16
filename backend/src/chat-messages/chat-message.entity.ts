import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { User } from '../users/user.entity';

@Entity()
export class ChatMessage {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Appointment, { onDelete: 'CASCADE' })
    appointment: Appointment;

    @ManyToOne(() => User, { eager: true, onDelete: 'RESTRICT' })
    sender: User;

    @Column('text')
    message: string;

    @CreateDateColumn()
    timestamp: Date;
}
