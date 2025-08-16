import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { User } from '../users/user.entity';

@Entity('chat_messages')
export class ChatMessage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    text: string;

    @CreateDateColumn()
    timestamp: Date;

    @ManyToOne(() => Appointment)
    appointment: Appointment;

    @ManyToOne(() => User, { eager: true })
    user: User;
}
