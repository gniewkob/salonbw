import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Check,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Check('CHK_product_unit_price', '"unitPrice" >= 0')
@Check('CHK_product_stock', '"stock" >= 0')
@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    brand: string;

    @Column('text', { nullable: true })
    description: string | null;

    @Column('decimal', { precision: 10, scale: 2 })
    unitPrice: number;

    @Column('int')
    stock: number;

    @Column('int', { default: 5 })
    lowStockThreshold: number;

    @CreateDateColumn({
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP',
    })
    createdAt: Date;

    @UpdateDateColumn({
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    })
    updatedAt: Date;
}
