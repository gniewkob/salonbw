import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Delivery } from './delivery.entity';

@Entity('suppliers')
export class Supplier {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 200 })
    name: string;

    @Column({ length: 200, nullable: true })
    contactPerson: string | null;

    @Column({ length: 100, nullable: true })
    email: string | null;

    @Column({ length: 20, nullable: true })
    phone: string | null;

    @Column({ type: 'text', nullable: true })
    address: string | null;

    @Column({ length: 20, nullable: true })
    nip: string | null;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @Column({ default: true })
    isActive: boolean;

    @OneToMany(() => Delivery, (delivery) => delivery.supplier)
    deliveries: Delivery[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
