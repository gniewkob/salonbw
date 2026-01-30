import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    Unique,
} from 'typeorm';
import { Service } from '../service.entity';
import { User } from '../../users/user.entity';
import { ColumnNumericTransformer } from '../../column-numeric.transformer';

@Entity('employee_services')
@Unique(['employee', 'service'])
export class EmployeeService {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    employee: User;

    @Column()
    employeeId: number;

    @ManyToOne(() => Service, (service) => service.employeeServices, {
        onDelete: 'CASCADE',
    })
    service: Service;

    @Column()
    serviceId: number;

    // Optional custom duration for this employee (overrides service duration)
    @Column({ nullable: true, type: 'int' })
    customDuration?: number;

    // Optional custom price for this employee (overrides service price)
    @Column('decimal', {
        nullable: true,
        transformer: new ColumnNumericTransformer(),
    })
    customPrice?: number;

    // Custom commission for this employee on this service
    @Column('decimal', {
        nullable: true,
        transformer: new ColumnNumericTransformer(),
    })
    commissionPercent?: number;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
