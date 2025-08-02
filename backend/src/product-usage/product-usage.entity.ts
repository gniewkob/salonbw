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
import { UsageType } from './usage-type.enum';

@Entity()
export class ProductUsage {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Appointment, {
        eager: true,
        onDelete: 'RESTRICT',
        nullable: true,
    })
    appointment: Appointment | null;

    @ManyToOne(() => Product, { eager: true, onDelete: 'RESTRICT' })
    product: Product;

    @Column('int')
    quantity: number;

    @Column({ type: 'enum', enum: UsageType, default: UsageType.INTERNAL })
    usageType: UsageType;

    @ManyToOne(() => User, { eager: true, onDelete: 'RESTRICT' })
    usedByEmployee: User;

    @CreateDateColumn()
    timestamp: Date;
}
