import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    Column,
    CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/user.entity';
import { LogAction } from './action.enum';

@Entity()
export class Log {
    @PrimaryGeneratedColumn()
    @ApiProperty()
    id: number;

    @ManyToOne(() => User, {
        nullable: true,
        eager: true,
        onDelete: 'SET NULL',
    })
    @ApiProperty({ type: () => User, nullable: true })
    user: User | null;

    @ManyToOne(() => User, {
        nullable: true,
        eager: true,
        onDelete: 'SET NULL',
    })
    @ApiProperty({ type: () => User, nullable: true })
    actor: User | null;

    @Column({ type: 'simple-enum', enum: LogAction })
    @ApiProperty({ enum: LogAction })
    action: LogAction;

    @Column({ type: 'text', nullable: true })
    @ApiProperty({ nullable: true })
    description: string | null;

    @CreateDateColumn()
    @ApiProperty()
    timestamp: Date;
}
