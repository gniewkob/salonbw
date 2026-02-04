import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { ColumnNumericTransformer } from '../column-numeric.transformer';
import { Supplier } from '../warehouse/entities/supplier.entity';
import { ProductCategory } from './entities/product-category.entity';

export enum ProductType {
    Product = 'product',
    Supply = 'supply',
    Universal = 'universal',
}

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 200 })
    name: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    brand: string | null;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    sku: string | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    barcode: string | null;

    @Column({
        type: 'varchar',
        length: 20,
        default: ProductType.Product,
    })
    productType: ProductType;

    @Column('decimal', {
        precision: 10,
        scale: 2,
        transformer: new ColumnNumericTransformer(),
    })
    unitPrice: number;

    @Column('decimal', {
        precision: 5,
        scale: 2,
        transformer: new ColumnNumericTransformer(),
        default: 23,
    })
    vatRate: number;

    @Column('decimal', {
        precision: 10,
        scale: 2,
        nullable: true,
        transformer: new ColumnNumericTransformer(),
    })
    purchasePrice: number | null;

    @Column('int', { default: 0 })
    stock: number;

    @Column('decimal', {
        precision: 10,
        scale: 3,
        nullable: true,
        transformer: new ColumnNumericTransformer(),
    })
    packageSize: number | null;

    @Column({ type: 'varchar', length: 20, nullable: true })
    packageUnit: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    manufacturer: string | null;

    @Column('int', { nullable: true })
    minQuantity: number | null;

    @Column({ type: 'varchar', length: 20, nullable: true })
    unit: string | null;

    @ManyToOne(() => Supplier, { nullable: true })
    @JoinColumn({ name: 'defaultSupplierId' })
    defaultSupplier: Supplier | null;

    @Column({ type: 'int', nullable: true })
    defaultSupplierId: number | null;

    @ManyToOne(() => ProductCategory, (category) => category.products, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'categoryId' })
    category: ProductCategory | null;

    @Column({ type: 'int', nullable: true })
    categoryId: number | null;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: true })
    trackStock: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
