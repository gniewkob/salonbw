import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from 'typeorm';
import { Service } from '../service.entity';
import { ServiceVariant } from './service-variant.entity';
import { Product } from '../../products/product.entity';
import { ColumnNumericTransformer } from '../../column-numeric.transformer';

@Entity('service_recipe_items')
export class ServiceRecipeItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Service, (service) => service.recipeItems, {
        onDelete: 'CASCADE',
    })
    service: Service;

    @Column()
    serviceId: number;

    @ManyToOne(() => ServiceVariant, { onDelete: 'SET NULL', nullable: true })
    serviceVariant?: ServiceVariant | null;

    @Column({ nullable: true })
    serviceVariantId?: number | null;

    @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
    product?: Product | null;

    @Column({ nullable: true })
    productId?: number | null;

    @Column('decimal', {
        nullable: true,
        transformer: new ColumnNumericTransformer(),
    })
    quantity?: number | null;

    @Column({ type: 'varchar', length: 20, nullable: true })
    unit?: string | null;

    @Column({ type: 'text', nullable: true })
    notes?: string | null;

    @CreateDateColumn()
    createdAt: Date;
}
