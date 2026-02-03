import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Service } from '../service.entity';

@Entity('service_media')
export class ServiceMedia {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Service, (service) => service.media, {
        onDelete: 'CASCADE',
    })
    service: Service;

    @Column()
    serviceId: number;

    @Column({ type: 'text' })
    url: string;

    @Column({ type: 'text', nullable: true })
    caption?: string | null;

    @Column({ default: 0 })
    sortOrder: number;

    @Column({ default: true })
    isPublic: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
