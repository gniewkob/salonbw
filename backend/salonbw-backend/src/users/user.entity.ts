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

    @Column({ type: 'simple-enum', enum: Role, default: Role.Client })
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

    // Standing discount for this client (percent, 0–100). When null the
    // client's group discount applies. Auto-suggested at finalization.
    @Column('decimal', {
        name: 'discount_percent',
        nullable: true,
        transformer: new ColumnNumericTransformer(),
    })
    discountPercent?: number | null;

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

    // Per-channel notification preferences. receiveNotifications above is the
    // master switch; these pick WHICH channels are used. Panel (in-app banner)
    // defaults on (free, no external delivery); the rest are opt-in.
    @Column({ default: true })
    notifyPanel: boolean;

    @Column({ default: false })
    smsConsent: boolean;

    @Column({ default: false })
    whatsappConsent: boolean;

    @Column({ default: false })
    emailConsent: boolean;

    @Column({ default: false })
    gdprConsent: boolean;

    @Column({ type: 'timestamp', nullable: true })
    gdprConsentDate?: Date | null;

    @Column({ default: false })
    termsConsent: boolean;

    @Column({ type: 'timestamp', nullable: true })
    termsConsentDate?: Date | null;

    // Social authentication
    @Column({ nullable: true, unique: true })
    googleId?: string;

    @Column({ nullable: true, unique: true })
    facebookId?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @ManyToMany(() => CustomerGroup, (group) => group.members)
    groups: CustomerGroup[];
}
