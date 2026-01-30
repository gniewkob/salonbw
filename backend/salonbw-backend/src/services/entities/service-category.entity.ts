import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Service } from '../service.entity';

@Entity('service_categories')
export class ServiceCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true, type: 'text' })
    description?: string;

    @Column({ nullable: true })
    color?: string;

    @Column({ default: 0 })
    sortOrder: number;

    @Column({ default: true })
    isActive: boolean;

    // Hierarchical structure - parent category
    @ManyToOne(() => ServiceCategory, (category) => category.children, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    parent?: ServiceCategory;

    @Column({ nullable: true })
    parentId?: number;

    // Child categories
    @OneToMany(() => ServiceCategory, (category) => category.parent)
    children: ServiceCategory[];

    // Services in this category
    @OneToMany(() => Service, (service) => service.categoryRelation)
    services: Service[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
