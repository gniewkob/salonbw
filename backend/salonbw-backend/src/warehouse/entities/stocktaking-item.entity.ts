import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Stocktaking } from './stocktaking.entity';
import { Product } from '../../products/product.entity';

@Entity('stocktaking_items')
export class StocktakingItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Stocktaking, (stocktaking) => stocktaking.items, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'stocktakingId' })
    stocktaking: Stocktaking;

    @Column()
    stocktakingId: number;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column()
    productId: number;

    @Column('int')
    systemQuantity: number;

    @Column('int', { nullable: true })
    countedQuantity: number | null;

    @Column('int', { nullable: true })
    difference: number | null;

    @Column({ type: 'text', nullable: true })
    notes: string | null;
}
