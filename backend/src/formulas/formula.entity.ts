import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';

@Entity()
export class Formula {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text')
    description: string;

    @CreateDateColumn()
    date: Date;

    @ManyToOne(() => User, { eager: true })
    client: User;

    @ManyToOne(() => Appointment, (appointment) => appointment.formulas, { nullable: true })
    appointment: Appointment | null;
}
