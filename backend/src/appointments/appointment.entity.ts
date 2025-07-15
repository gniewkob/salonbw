import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    Column,
    OneToMany,
    Index,
} from 'typeorm';
import { Employee } from '../employees/employee.entity';
import { Customer } from '../customers/customer.entity';
import { Service } from '../catalog/service.entity';
import { Formula } from '../formulas/formula.entity';

export enum AppointmentStatus {
    Scheduled = 'scheduled',
    Completed = 'completed',
    Cancelled = 'cancelled',
}
@Index(['employee', 'startTime'], { unique: true })
@Entity()
export class Appointment {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Customer, { eager: true, onDelete: 'RESTRICT' })
    client: Customer;

    @ManyToOne(() => Employee, { eager: true, onDelete: 'RESTRICT' })
    employee: Employee;

    @Column()
    startTime: Date;

    @Column({ nullable: true })
    endTime: Date;

    @Column({ nullable: true })
    notes: string;

    @ManyToOne(() => Service, { eager: true, onDelete: 'RESTRICT' })
    service: Service;

    @OneToMany(() => Formula, (formula) => formula.appointment)
    formulas: Formula[];

    @Column({ type: 'simple-enum', enum: AppointmentStatus, default: AppointmentStatus.Scheduled })
    status: AppointmentStatus;
}
