import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { ColumnNumericTransformer } from '../../column-numeric.transformer';
import { Supplier } from './supplier.entity';
import { DeliveryItem } from './delivery-item.entity';
import { User } from '../../users/user.entity';

export enum DeliveryStatus {
    Draft = 'draft',
    Pending = 'pending',
    Received = 'received',
    Cancelled = 'cancelled',
}

@Entity('deliveries')
export class Delivery {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 50, unique: true })
    deliveryNumber: string;

    @ManyToOne(() => Supplier, { nullable: true })
    @JoinColumn({ name: 'supplierId' })
    supplier: Supplier | null;

    @Column({ nullable: true })
    supplierId: number | null;

    @Column({
        type: 'varchar',
        length: 20,
        default: DeliveryStatus.Draft,
    })
    status: DeliveryStatus;

    @Column({ type: 'date', nullable: true })
    deliveryDate: Date | null;

    @Column({ type: 'date', nullable: true })
    receivedDate: Date | null;

    @Column({ length: 100, nullable: true })
    invoiceNumber: string | null;

    @Column('decimal', {
        precision: 12,
        scale: 2,
        default: 0,
        transformer: new ColumnNumericTransformer(),
    })
    totalCost: number;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'receivedById' })
    receivedBy: User | null;

    @Column({ nullable: true })
    receivedById: number | null;

    @OneToMany(() => DeliveryItem, (item) => item.delivery, { cascade: true })
    items: DeliveryItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
