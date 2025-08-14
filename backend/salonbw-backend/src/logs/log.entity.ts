import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    Column,
    CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum LogAction {
    Login = 'login',
    Logout = 'logout',
    Create = 'create',
    Update = 'update',
    Delete = 'delete',
    AUTHORIZATION_FAIL = 'authorization_fail',
}

@Entity('logs')
export class Log {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { nullable: true, eager: true })
    user?: User | null;

    @Column({ type: 'simple-enum', enum: LogAction })
    action: LogAction;

    @Column({ type: 'simple-json', nullable: true })
    description?: string | Record<string, any>;

    @CreateDateColumn()
    timestamp: Date;
}
