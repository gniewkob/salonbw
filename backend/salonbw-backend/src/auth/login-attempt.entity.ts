import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
} from 'typeorm';

@Entity()
export class LoginAttempt {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: string;

    @Column()
    ipAddress: string;

    @Column({ default: false })
    successful: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ nullable: true })
    captchaRequired?: boolean;
}
