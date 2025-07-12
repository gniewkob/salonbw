import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Role } from './role.enum';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string; // hashed

    @Column()
    name: string;

    @Column({ type: 'enum', enum: Role })
    role: Role;

    @Column({ nullable: true })
    refreshToken?: string | null;
}
