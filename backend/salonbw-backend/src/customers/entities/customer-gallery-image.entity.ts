import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('customer_gallery_images')
export class CustomerGalleryImage {
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

    @Column({ type: 'varchar', length: 512 })
    path: string;

    @Column({ type: 'varchar', length: 512 })
    thumbnailPath: string;

    @Column({ type: 'varchar', length: 100 })
    mimeType: string;

    @Column({ type: 'int' })
    size: number;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'int', nullable: true })
    serviceId: number | null;

    @CreateDateColumn()
    createdAt: Date;
}
