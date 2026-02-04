import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { ColumnNumericTransformer } from '../../column-numeric.transformer';
import { WarehouseSale } from './warehouse-sale.entity';
import { Product } from '../../products/product.entity';

@Entity('warehouse_sale_items')
export class WarehouseSaleItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => WarehouseSale, (sale) => sale.items, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'saleId' })
    sale: WarehouseSale;

    @Column({ type: 'int' })
    saleId: number;

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

    @Column('decimal', {
        precision: 10,
        scale: 2,
        transformer: new ColumnNumericTransformer(),
    })
    unitPriceNet: number;

    @Column('decimal', {
        precision: 10,
        scale: 2,
        transformer: new ColumnNumericTransformer(),
    })
    unitPriceGross: number;

    @Column('decimal', {
        precision: 5,
        scale: 2,
        default: 23,
        transformer: new ColumnNumericTransformer(),
    })
    vatRate: number;

    @Column('decimal', {
        precision: 10,
        scale: 2,
        default: 0,
        transformer: new ColumnNumericTransformer(),
    })
    discountGross: number;

    @Column('decimal', {
        precision: 10,
        scale: 2,
        transformer: new ColumnNumericTransformer(),
    })
    totalNet: number;

    @Column('decimal', {
        precision: 10,
        scale: 2,
        transformer: new ColumnNumericTransformer(),
    })
    totalGross: number;

    @CreateDateColumn()
    createdAt: Date;
}
