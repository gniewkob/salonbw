import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    Column,
    CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Message {
    @PrimaryGeneratedColumn()
    @ApiProperty({ example: 1 })
    id: number;

    @ManyToOne(() => User, { eager: true, onDelete: 'RESTRICT' })
    @ApiProperty({ type: () => User })
    sender: User;

    @ManyToOne(() => User, { eager: true, onDelete: 'RESTRICT' })
    @ApiProperty({ type: () => User })
    recipient: User;

    @Column()
    @ApiProperty({ example: 'Hello there!' })
    content: string;

    @CreateDateColumn()
    @ApiProperty({
        type: String,
        format: 'date-time',
        example: '2024-01-01T12:00:00.000Z',
    })
    sentAt: Date;
}
