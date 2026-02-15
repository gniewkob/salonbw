import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('content_sections')
export class ContentSection {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    key: string; // e.g., 'hero_slides', 'founder_message', 'history_items', 'core_values'

    @Column({ type: 'jsonb' })
    data: Record<string, unknown>;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
