import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from 'typeorm';
import { Employee } from '../employees/employee.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Product } from '../catalog/product.entity';

@Entity()
export class CommissionRecord {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Employee, { eager: true, onDelete: 'RESTRICT' })
    employee: Employee;

    @ManyToOne(() => Appointment, { nullable: true, onDelete: 'SET NULL' })
    appointment: Appointment | null;

    @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
    product: Product | null;

    @Column('decimal', { precision: 10, scale: 2 })
    amount: number;

    @Column('float')
    percent: number;

    @CreateDateColumn()
    createdAt: Date;
}
