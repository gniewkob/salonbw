import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { WarehouseUsage } from './warehouse-usage.entity';
import { Product } from '../../products/product.entity';

@Entity('warehouse_usage_items')
export class WarehouseUsageItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => WarehouseUsage, (usage) => usage.items, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'usageId' })
    usage: WarehouseUsage;

    @Column({ type: 'int' })
    usageId: number;

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
    stockBefore: number;

    @Column({ type: 'int', default: 0 })
    stockAfter: number;

    @CreateDateColumn()
    createdAt: Date;
}
