import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Product } from '../product.entity';

@Entity('product_categories')
export class ProductCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 120 })
    name: string;

    @ManyToOne(() => ProductCategory, (category) => category.children, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'parentId' })
    parent?: ProductCategory | null;

    @Column({ type: 'int', nullable: true })
    parentId?: number | null;

    @OneToMany(() => ProductCategory, (category) => category.parent)
    children: ProductCategory[];

    @OneToMany(() => Product, (product) => product.category)
    products: Product[];

    @Column({ type: 'int', default: 0 })
    sortOrder: number;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
