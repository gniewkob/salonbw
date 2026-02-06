import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

export enum BranchStatus {
    Active = 'active',
    Inactive = 'inactive',
    Suspended = 'suspended',
}

@Entity('branches')
export class Branch {
    @PrimaryGeneratedColumn()
    id: number;

    // Basic info
    @Column({ length: 255 })
    name: string;

    @Column({ length: 100, unique: true })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    // Contact info
    @Column({ length: 20, nullable: true })
    phone: string;

    @Column({ length: 255, nullable: true })
    email: string;

    // Address
    @Column({ length: 255, nullable: true })
    street: string;

    @Column({ name: 'building_number', length: 20, nullable: true })
    buildingNumber: string;

    @Column({ name: 'apartment_number', length: 20, nullable: true })
    apartmentNumber: string;

    @Column({ name: 'postal_code', length: 10, nullable: true })
    postalCode: string;

    @Column({ length: 100, nullable: true })
    city: string;

    @Column({ length: 100, nullable: true })
    country: string;

    // Geolocation for maps
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    longitude: number;

    // Branding
    @Column({ name: 'logo_url', length: 500, nullable: true })
    logoUrl: string;

    @Column({ name: 'cover_image_url', length: 500, nullable: true })
    coverImageUrl: string;

    @Column({ name: 'primary_color', length: 7, default: '#25B4C1' })
    primaryColor: string;

    // Working hours (JSON for flexibility)
    @Column({
        name: 'working_hours',
        type: 'jsonb',
        default: () =>
            `'{"mon": {"open": "09:00", "close": "18:00"}, "tue": {"open": "09:00", "close": "18:00"}, "wed": {"open": "09:00", "close": "18:00"}, "thu": {"open": "09:00", "close": "18:00"}, "fri": {"open": "09:00", "close": "18:00"}, "sat": {"open": "10:00", "close": "14:00"}, "sun": null}'`,
    })
    workingHours: Record<string, { open: string; close: string } | null>;

    // Settings
    @Column({ name: 'timezone', length: 50, default: 'Europe/Warsaw' })
    timezone: string;

    @Column({ length: 3, default: 'PLN' })
    currency: string;

    @Column({ length: 10, default: 'pl' })
    locale: string;

    // Status
    @Column({
        type: 'enum',
        enum: BranchStatus,
        default: BranchStatus.Active,
    })
    status: BranchStatus;

    // Online booking
    @Column({ name: 'online_booking_enabled', default: true })
    onlineBookingEnabled: boolean;

    @Column({ name: 'booking_url', length: 255, nullable: true })
    bookingUrl: string;

    // Ownership - who created/owns this branch
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'owner_id' })
    owner: User;

    @Column({ name: 'owner_id', nullable: true })
    ownerId: number;

    // Sort order for display
    @Column({ name: 'sort_order', default: 0 })
    sortOrder: number;

    // Metadata
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations - branch members
    @OneToMany(() => BranchMember, (member) => member.branch)
    members: BranchMember[];
}

// Branch membership - which users belong to which branches
@Entity('branch_members')
export class BranchMember {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Branch, (branch) => branch.members, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'branch_id' })
    branch: Branch;

    @Column({ name: 'branch_id' })
    branchId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id' })
    userId: number;

    // Role within this branch (can be different from global role)
    @Column({ name: 'branch_role', length: 50, default: 'employee' })
    branchRole: string;

    // Is this the user's primary/default branch?
    @Column({ name: 'is_primary', default: false })
    isPrimary: boolean;

    // Can this user manage this branch?
    @Column({ name: 'can_manage', default: false })
    canManage: boolean;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
