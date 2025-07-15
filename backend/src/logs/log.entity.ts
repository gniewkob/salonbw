import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    Column,
    CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { LogAction } from './action.enum';

@Entity()
export class Log {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { nullable: true, eager: true, onDelete: 'SET NULL' })
    user: User | null;

    @Column({ type: 'simple-enum', enum: LogAction })
    action: LogAction;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @CreateDateColumn()
    timestamp: Date;
}
