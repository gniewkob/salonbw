import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    Column,
    CreateDateColumn,
} from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { Product } from '../catalog/product.entity';
import { User } from '../users/user.entity';

@Entity()
export class ProductUsage {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Appointment, { eager: true, onDelete: 'RESTRICT' })
    appointment: Appointment;

    @ManyToOne(() => Product, { eager: true, onDelete: 'RESTRICT' })
    product: Product;

    @Column('int')
    quantity: number;

    @ManyToOne(() => User, { eager: true, onDelete: 'RESTRICT' })
    usedByEmployee: User;

    @CreateDateColumn()
    timestamp: Date;
}
