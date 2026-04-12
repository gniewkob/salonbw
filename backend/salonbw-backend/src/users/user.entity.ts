import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToMany,
} from 'typeorm';
import { Role } from './role.enum';
import { ColumnNumericTransformer } from '../column-numeric.transformer';
import { ApiHideProperty } from '@nestjs/swagger';
import { CustomerGroup } from '../customers/entities/customer-group.entity';

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

    @Column({ type: 'simple-enum', enum: Role, default: Role.Customer })
    role: Role;

    @Column({ type: 'varchar', nullable: true })
    phone: string | null;

    @Column({ default: true })
    receiveNotifications: boolean;

    @Column({
        type: 'integer',
        nullable: true,
        name: 'paranoia_limit_override',
    })
    paranoiaLimitOverride?: number | null;

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

    @Column({ type: 'datetime', nullable: true })
    gdprConsentDate?: Date;

    // Social Auth IDs
    @Column({ name: 'google_id', type: 'varchar', length: 100, nullable: true, unique: true })
    googleId?: string | null;

    @Column({ name: 'facebook_id', type: 'varchar', length: 100, nullable: true, unique: true })
    facebookId?: string | null;

    @Column({ name: 'apple_id', type: 'varchar', length: 100, nullable: true, unique: true })
    appleId?: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @ManyToMany(() => CustomerGroup, (group) => group.members)
    groups: CustomerGroup[];
}
