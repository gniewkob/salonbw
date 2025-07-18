import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from 'typeorm';
import { Employee } from '../employees/employee.entity';

@Entity()
export class EmployeeCommission {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Employee, (employee) => employee.commissions, {
        onDelete: 'RESTRICT',
    })
    employee: Employee;

    @Column('decimal', { precision: 10, scale: 2 })
    amount: number;

    @Column('float')
    percent: number;

    @CreateDateColumn()
    createdAt: Date;
}
