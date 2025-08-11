import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    Column,
    CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Product } from '../products/product.entity';

@Entity('commissions')
export class Commission {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { eager: true })
    employee: User;

    @ManyToOne(() => Appointment, { nullable: true, eager: true })
    appointment?: Appointment | null;

    @ManyToOne(() => Product, { nullable: true, eager: true })
    product?: Product | null;

    @Column('decimal')
    amount: number;

    @Column('decimal')
    percent: number;

    @CreateDateColumn()
    createdAt: Date;
}
