import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { Customer } from '../customers/customer.entity';
import { Employee } from '../employees/employee.entity';
import { MaxLength } from 'class-validator';

@Index(['appointmentId'], { unique: true })
@Entity()
export class Review {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    appointmentId: number;

    @ManyToOne(() => Appointment, { onDelete: 'RESTRICT' })
    appointment: Appointment;

    @ManyToOne(() => Customer, { eager: true, onDelete: 'RESTRICT' })
    author: Customer;

    @ManyToOne(() => Employee, { eager: true, onDelete: 'RESTRICT' })
    employee: Employee;

    @Column('int')
    rating: number;

    @Column('text', { nullable: true })
    @MaxLength(500)
    comment?: string;

    @CreateDateColumn()
    createdAt: Date;
}
