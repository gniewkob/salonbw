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
import { ColumnNumericTransformer } from '../../column-numeric.transformer';
import { WarehouseSaleItem } from './warehouse-sale-item.entity';
import { User } from '../../users/user.entity';

@Entity('warehouse_sales')
export class WarehouseSale {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 60, unique: true })
    saleNumber: string;

    @Column({ type: 'timestamp', default: () => 'now()' })
    soldAt: Date;

    @Column({ type: 'varchar', length: 200, nullable: true })
    clientName: string | null;

    @Column({ type: 'int', nullable: true })
    clientId: number | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'employeeId' })
    employee: User | null;

    @Column({ type: 'int', nullable: true })
    employeeId: number | null;

    @Column({ type: 'int', nullable: true })
    appointmentId: number | null;

    @Column('decimal', {
        precision: 10,
        scale: 2,
        default: 0,
        transformer: new ColumnNumericTransformer(),
    })
    discountGross: number;

    @Column('decimal', {
        precision: 10,
        scale: 2,
        default: 0,
        transformer: new ColumnNumericTransformer(),
    })
    totalNet: number;

    @Column('decimal', {
        precision: 10,
        scale: 2,
        default: 0,
        transformer: new ColumnNumericTransformer(),
    })
    totalGross: number;

    @Column({ type: 'varchar', length: 30, nullable: true })
    paymentMethod: string | null;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'createdById' })
    createdBy: User | null;

    @Column({ type: 'int', nullable: true })
    createdById: number | null;

    @OneToMany(() => WarehouseSaleItem, (item) => item.sale, {
        cascade: true,
    })
    items: WarehouseSaleItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
