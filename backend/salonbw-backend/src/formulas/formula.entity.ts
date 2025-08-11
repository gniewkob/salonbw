import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';

@Entity('formulas')
export class Formula {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    description: string;

    @Column()
    date: Date;

    @ManyToOne(() => User, { eager: true })
    client: User;

    @ManyToOne(() => Appointment, { eager: true, nullable: true })
    appointment?: Appointment;
}

