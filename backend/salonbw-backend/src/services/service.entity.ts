import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
} from 'typeorm';
import { ColumnNumericTransformer } from '../column-numeric.transformer';
import { ServiceCategory } from './entities/service-category.entity';
import { ServiceVariant } from './entities/service-variant.entity';
import { EmployeeService } from './entities/employee-service.entity';
import { ServiceMedia } from './entities/service-media.entity';
import { ServiceReview } from './entities/service-review.entity';
import { ServiceRecipeItem } from './entities/service-recipe-item.entity';

export enum PriceType {
    Fixed = 'fixed',
    From = 'from',
}

@Entity('services')
export class Service {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column('int')
    duration: number;

    @Column('decimal', { transformer: new ColumnNumericTransformer() })
    price: number;

    @Column({
        type: 'simple-enum',
        enum: PriceType,
        default: PriceType.Fixed,
    })
    priceType: PriceType;

    @Column('decimal', {
        nullable: true,
        transformer: new ColumnNumericTransformer(),
    })
    vatRate?: number;

    @Column({ default: false })
    isFeatured: boolean;

    @Column({ type: 'text', nullable: true })
    publicDescription?: string;

    @Column({ type: 'text', nullable: true })
    privateDescription?: string;

    // Legacy string category (kept for backward compatibility)
    @Column({ nullable: true })
    category?: string;

    // Relation to ServiceCategory
    @ManyToOne(() => ServiceCategory, (cat) => cat.services, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'categoryId' })
    categoryRelation?: ServiceCategory;

    @Column({ nullable: true })
    categoryId?: number;

    @Column('decimal', {
        nullable: true,
        transformer: new ColumnNumericTransformer(),
    })
    commissionPercent?: number;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: true })
    onlineBooking: boolean;

    @Column({ default: 0 })
    sortOrder: number;

    // Variants for this service
    @OneToMany(() => ServiceVariant, (variant) => variant.service)
    variants: ServiceVariant[];

    @OneToMany(() => ServiceMedia, (media) => media.service)
    media: ServiceMedia[];

    @OneToMany(() => ServiceReview, (review) => review.service)
    reviews: ServiceReview[];

    @OneToMany(() => ServiceRecipeItem, (item) => item.service)
    recipeItems: ServiceRecipeItem[];

    // Employee assignments
    @OneToMany(() => EmployeeService, (es) => es.service)
    employeeServices: EmployeeService[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
