import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.enum';
import { ColumnNumericTransformer } from '../column-numeric.transformer';
import { ApiHideProperty } from '@nestjs/swagger';

export enum Gender {
    Male = 'male',
    Female = 'female',
    Other = 'other',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @ApiHideProperty()
    @Column({ select: false })
    password: string;

    @Column()
    name: string;

    @Column({ type: 'simple-enum', enum: Role, default: Role.Client })
    role: Role;

    @Column({ type: 'varchar', nullable: true })
    phone: string | null;

    @Column({ default: true })
    receiveNotifications: boolean;

    @Column('decimal', {
        transformer: new ColumnNumericTransformer(),
        default: 0,
    })
    commissionBase: number;

    // CRM fields for clients
    @Column({ nullable: true })
    firstName?: string;

    @Column({ nullable: true })
    lastName?: string;

    @Column({ nullable: true, type: 'date' })
    birthDate?: Date;

    @Column({ type: 'simple-enum', enum: Gender, nullable: true })
    gender?: Gender;

    @Column({ nullable: true })
    address?: string;

    @Column({ nullable: true })
    city?: string;

    @Column({ nullable: true })
    postalCode?: string;

    @Column({ nullable: true, type: 'text' })
    description?: string;

    @Column({ default: false })
    smsConsent: boolean;

    @Column({ default: false })
    emailConsent: boolean;

    @Column({ default: false })
    gdprConsent: boolean;

    @Column({ nullable: true })
    gdprConsentDate?: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
