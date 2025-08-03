import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
} from 'typeorm';
import { Role } from './role.enum';
import { EmployeeRole } from '../employees/employee-role.enum';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column({ type: 'varchar', nullable: true })
    password: string | null; // hashed, null for social accounts

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ type: 'varchar', nullable: true })
    phone: string | null;

    @Column({ type: 'boolean', default: false })
    privacyConsent: boolean;

    @Column({ type: 'boolean', default: false })
    marketingConsent: boolean;

    @Column({ type: 'simple-enum', enum: Role })
    role: Role | EmployeeRole;

    @Column({ type: 'varchar', nullable: true })
    refreshToken: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'float', nullable: true })
    commissionBase: number | null;

    @DeleteDateColumn({ type: 'timestamptz', nullable: true })
    deletedAt: Date | null;
}
