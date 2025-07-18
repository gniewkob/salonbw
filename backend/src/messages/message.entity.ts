import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    Column,
    CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { eager: true, onDelete: 'RESTRICT' })
    sender: User;

    @ManyToOne(() => User, { eager: true, onDelete: 'RESTRICT' })
    recipient: User;

    @Column()
    content: string;

    @CreateDateColumn()
    sentAt: Date;
}
