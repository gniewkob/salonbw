import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Service } from '../service.entity';
import { ColumnNumericTransformer } from '../../column-numeric.transformer';

export enum PriceType {
    Fixed = 'fixed',
    From = 'from',
}

@Entity('service_variants')
export class ServiceVariant {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Service, (service) => service.variants, {
        onDelete: 'CASCADE',
    })
    service: Service;

    @Column()
    serviceId: number;

    @Column()
    name: string;

    @Column({ nullable: true })
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

    @Column({ default: 0 })
    sortOrder: number;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
