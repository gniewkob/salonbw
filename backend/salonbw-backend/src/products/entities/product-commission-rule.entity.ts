import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Unique,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { ColumnNumericTransformer } from '../../column-numeric.transformer';
import { Product } from '../product.entity';
import { User } from '../../users/user.entity';

@Entity('product_commission_rules')
@Unique('UQ_product_commission_rules_product_employee', [
    'productId',
    'employeeId',
])
export class ProductCommissionRule {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Product, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column({ type: 'int' })
    productId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'employeeId' })
    employee: User;

    @Column({ type: 'int' })
    employeeId: number;

    @Column('decimal', {
        precision: 5,
        scale: 2,
        transformer: new ColumnNumericTransformer(),
    })
    commissionPercent: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
