import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';

@Entity('chat_messages')
export class ChatMessage {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { eager: true })
    user: User;

    @ManyToOne(() => Appointment, { eager: true })
    appointment: Appointment;

    @Column()
    content: string;

    @CreateDateColumn()
    timestamp: Date;
}
