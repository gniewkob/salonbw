import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

export enum CustomerFileCategory {
    Consent = 'consent',
    Contract = 'contract',
    Medical = 'medical',
    Invoice = 'invoice',
    Other = 'other',
}

@Entity('customer_files')
export class CustomerFile {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    customerId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'customerId' })
    customer: User;

    @Column({ nullable: true })
    uploadedById: number | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'uploadedById' })
    uploadedBy: User | null;

    @Column({ type: 'varchar', length: 255 })
    originalName: string;

    @Column({ type: 'varchar', length: 255 })
    storedName: string;

    @Column({ type: 'varchar', length: 512 })
    path: string;

    @Column({ type: 'varchar', length: 100 })
    mimeType: string;

    @Column({ type: 'int' })
    size: number;

    @Column({
        type: 'enum',
        enum: CustomerFileCategory,
        default: CustomerFileCategory.Other,
    })
    category: CustomerFileCategory;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @CreateDateColumn()
    createdAt: Date;
}
