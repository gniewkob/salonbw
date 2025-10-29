import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    Index,
    CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'refresh_tokens' })
export class RefreshToken {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({ type: 'int' })
    userId: number;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 255 })
    jti: string;

    @Column({ type: 'timestamptz', nullable: false })
    expiresAt: Date;

    @Column({ type: 'timestamptz', nullable: true })
    revokedAt?: Date | null;

    @Column({ type: 'jsonb', nullable: true })
    meta?: Record<string, unknown>;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}
