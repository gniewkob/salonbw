import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { ColumnNumericTransformer } from '../../column-numeric.transformer';
import { Delivery } from './delivery.entity';
import { Product } from '../../products/product.entity';

@Entity('delivery_items')
export class DeliveryItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Delivery, (delivery) => delivery.items, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'deliveryId' })
    delivery: Delivery;

    @Column()
    deliveryId: number;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column()
    productId: number;

    @Column('int')
    quantity: number;

    @Column('decimal', {
        precision: 10,
        scale: 2,
        transformer: new ColumnNumericTransformer(),
    })
    unitCost: number;

    @Column('decimal', {
        precision: 12,
        scale: 2,
        transformer: new ColumnNumericTransformer(),
    })
    totalCost: number;

    @Column({ type: 'varchar', length: 50, nullable: true })
    batchNumber: string | null;

    @Column({ type: 'date', nullable: true })
    expiryDate: Date | null;
}
