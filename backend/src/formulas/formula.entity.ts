import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { Appointment } from '../appointments/appointment.entity';

@Entity()
export class Formula {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text')
    description: string;

    @CreateDateColumn()
    date: Date;

    @ManyToOne(() => Customer, { eager: true })
    client: Customer;

    @ManyToOne(() => Appointment, (appointment) => appointment.formulas, { nullable: true })
    appointment: Appointment | null;
}
