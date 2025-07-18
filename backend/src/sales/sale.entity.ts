import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    Column,
    CreateDateColumn,
} from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { Employee } from '../employees/employee.entity';
import { Product } from '../catalog/product.entity';

@Entity()
export class Sale {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Customer, { eager: true, onDelete: 'RESTRICT' })
    client: Customer;

    @ManyToOne(() => Employee, { eager: true, onDelete: 'RESTRICT' })
    employee: Employee;

    @ManyToOne(() => Product, { eager: true, onDelete: 'RESTRICT' })
    product: Product;

    @Column('int')
    quantity: number;

    @CreateDateColumn()
    soldAt: Date;
}
