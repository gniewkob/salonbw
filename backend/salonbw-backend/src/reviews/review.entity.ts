import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';

@Entity('reviews')
export class Review {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { eager: true })
    client: User;

    @ManyToOne(() => User, { eager: true })
    employee: User;

    @ManyToOne(() => Appointment, { eager: true, nullable: true })
    appointment: Appointment | null;

    @Column('int')
    rating: number; // 1-5

    @Column({ nullable: true })
    comment?: string;

    @CreateDateColumn()
    createdAt: Date;
}
