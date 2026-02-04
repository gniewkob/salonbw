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
import { WarehouseUsageItem } from './warehouse-usage-item.entity';
import { User } from '../../users/user.entity';

@Entity('warehouse_usages')
export class WarehouseUsage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 60, unique: true })
    usageNumber: string;

    @Column({ type: 'timestamp', default: () => 'now()' })
    usedAt: Date;

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

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'createdById' })
    createdBy: User | null;

    @Column({ type: 'int', nullable: true })
    createdById: number | null;

    @OneToMany(() => WarehouseUsageItem, (item) => item.usage, {
        cascade: true,
    })
    items: WarehouseUsageItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
