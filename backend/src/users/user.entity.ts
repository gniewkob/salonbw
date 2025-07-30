import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Role } from './role.enum';
import { EmployeeRole } from '../employees/employee-role.enum';

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

    @Column({ type: 'varchar', nullable: true })
    phone: string | null;

    @Column({ type: 'boolean', default: false })
    consentRODO: boolean;

    @Column({ type: 'boolean', default: false })
    consentMarketing: boolean;

    @Column({ type: 'simple-enum', enum: Role })
    role: Role | EmployeeRole;

    @Column({ type: 'varchar', nullable: true })
    refreshToken: string | null;

    @Column({ type: 'float', nullable: true })
    commissionBase: number | null;
}
