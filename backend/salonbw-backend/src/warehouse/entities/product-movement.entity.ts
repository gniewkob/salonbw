import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Product } from '../../products/product.entity';
import { User } from '../../users/user.entity';
import { Delivery } from './delivery.entity';
import { Stocktaking } from './stocktaking.entity';

export enum MovementType {
    Delivery = 'delivery',
    Sale = 'sale',
    Usage = 'usage',
    Adjustment = 'adjustment',
    Stocktaking = 'stocktaking',
    Return = 'return',
    Loss = 'loss',
}

@Entity('product_movements')
export class ProductMovement {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column()
    productId: number;

    @Column({
        type: 'varchar',
        length: 20,
    })
    movementType: MovementType;

    @Column('int')
    quantity: number;

    @Column('int')
    quantityBefore: number;

    @Column('int')
    quantityAfter: number;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'createdById' })
    createdBy: User | null;

    @Column({ nullable: true })
    createdById: number | null;

    @ManyToOne(() => Delivery, { nullable: true })
    @JoinColumn({ name: 'deliveryId' })
    delivery: Delivery | null;

    @Column({ nullable: true })
    deliveryId: number | null;

    @ManyToOne(() => Stocktaking, { nullable: true })
    @JoinColumn({ name: 'stocktakingId' })
    stocktaking: Stocktaking | null;

    @Column({ nullable: true })
    stocktakingId: number | null;

    @Column({ nullable: true })
    appointmentId: number | null;

    @CreateDateColumn()
    createdAt: Date;
}
