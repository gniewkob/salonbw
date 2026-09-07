import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'password_reset_tokens' })
export class PasswordResetToken {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({ type: 'int' })
    userId: number;

    @Index({ unique: true })
    @Column({ type: 'char', length: 64 })
    tokenHash: string;

    @Index()
    @Column({ type: 'timestamptz' })
    expiresAt: Date;

    @Column({ type: 'timestamptz', nullable: true })
    usedAt?: Date | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}
