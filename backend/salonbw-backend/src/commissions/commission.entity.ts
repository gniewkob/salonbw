import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    Column,
    CreateDateColumn,
} from 'typeorm';
import { ColumnNumericTransformer } from '../column-numeric.transformer';
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

    @Column('decimal', { transformer: new ColumnNumericTransformer() })
    amount: number;

    @Column('decimal', { transformer: new ColumnNumericTransformer() })
    percent: number;

    @CreateDateColumn()
    createdAt: Date;
}
