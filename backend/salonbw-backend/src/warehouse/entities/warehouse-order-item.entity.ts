import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { WarehouseOrder } from './warehouse-order.entity';
import { Product } from '../../products/product.entity';

@Entity('warehouse_order_items')
export class WarehouseOrderItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => WarehouseOrder, (order) => order.items, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'orderId' })
    order: WarehouseOrder;

    @Column({ type: 'int' })
    orderId: number;

    @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'productId' })
    product: Product | null;

    @Column({ type: 'int', nullable: true })
    productId: number | null;

    @Column({ type: 'varchar', length: 200 })
    productName: string;

    @Column({ type: 'int', default: 1 })
    quantity: number;

    @Column({ type: 'varchar', length: 20, default: 'op.' })
    unit: string;

    @Column({ type: 'int', default: 0 })
    receivedQuantity: number;

    @CreateDateColumn()
    createdAt: Date;
}
