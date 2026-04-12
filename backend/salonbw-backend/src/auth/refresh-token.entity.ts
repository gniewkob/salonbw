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

    @Column({ nullable: false })
    expiresAt: Date;

    @Column({ nullable: true })
    revokedAt?: Date;

    @Column({ type: 'simple-json', nullable: true })
    meta?: Record<string, unknown>;

    @CreateDateColumn()
    createdAt: Date;
}
