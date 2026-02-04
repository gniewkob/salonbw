import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { WarehouseOrderItem } from './warehouse-order-item.entity';
import { User } from '../../users/user.entity';
import { Supplier } from './supplier.entity';

export enum WarehouseOrderStatus {
    Draft = 'draft',
    Sent = 'sent',
    PartiallyReceived = 'partially_received',
    Received = 'received',
    Cancelled = 'cancelled',
}

@Entity('warehouse_orders')
export class WarehouseOrder {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 60, unique: true })
    orderNumber: string;

    @ManyToOne(() => Supplier, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'supplierId' })
    supplier: Supplier | null;

    @Column({ type: 'int', nullable: true })
    supplierId: number | null;

    @Column({ type: 'varchar', length: 40, default: WarehouseOrderStatus.Draft })
    status: WarehouseOrderStatus;

    @Column({ type: 'timestamp', nullable: true })
    sentAt: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    receivedAt: Date | null;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'createdById' })
    createdBy: User | null;

    @Column({ type: 'int', nullable: true })
    createdById: number | null;

    @OneToMany(() => WarehouseOrderItem, (item) => item.order, {
        cascade: true,
    })
    items: WarehouseOrderItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
