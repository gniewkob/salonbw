import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Product } from '../catalog/product.entity';

@Entity()
export class CommissionRecord {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { eager: true, onDelete: 'RESTRICT' })
    employee: User;

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
