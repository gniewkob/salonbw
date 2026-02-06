import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('branch_settings')
export class BranchSettings {
    @PrimaryGeneratedColumn()
    id: number;

    // Company info
    @Column({ name: 'company_name', length: 255 })
    companyName: string;

    @Column({ name: 'display_name', length: 255, nullable: true })
    displayName: string;

    @Column({ length: 20, nullable: true })
    nip: string;

    @Column({ length: 20, nullable: true })
    regon: string;

    // Address
    @Column({ length: 255, nullable: true })
    street: string;

    @Column({ name: 'building_number', length: 20, nullable: true })
    buildingNumber: string;

    @Column({ name: 'apartment_number', length: 20, nullable: true })
    apartmentNumber: string;

    @Column({ length: 10, nullable: true })
    postalCode: string;

    @Column({ length: 100, nullable: true })
    city: string;

    @Column({ length: 100, nullable: true })
    country: string;

    // Contact
    @Column({ length: 20, nullable: true })
    phone: string;

    @Column({ name: 'phone_secondary', length: 20, nullable: true })
    phoneSecondary: string;

    @Column({ length: 255, nullable: true })
    email: string;

    @Column({ length: 255, nullable: true })
    website: string;

    // Social media
    @Column({ name: 'facebook_url', length: 255, nullable: true })
    facebookUrl: string;

    @Column({ name: 'instagram_url', length: 255, nullable: true })
    instagramUrl: string;

    @Column({ name: 'tiktok_url', length: 255, nullable: true })
    tiktokUrl: string;

    // Branding
    @Column({ name: 'logo_url', length: 500, nullable: true })
    logoUrl: string;

    @Column({ name: 'primary_color', length: 7, default: '#25B4C1' })
    primaryColor: string;

    // Business settings
    @Column({ length: 3, default: 'PLN' })
    currency: string;

    @Column({ length: 10, default: 'pl' })
    locale: string;

    @Column({ length: 50, default: 'Europe/Warsaw' })
    timezone: string;

    // Tax settings
    @Column({
        name: 'default_vat_rate',
        type: 'decimal',
        precision: 5,
        scale: 2,
        default: 23,
    })
    defaultVatRate: number;

    @Column({ name: 'is_vat_payer', default: true })
    isVatPayer: boolean;

    // Receipt/Invoice settings
    @Column({ name: 'receipt_footer', type: 'text', nullable: true })
    receiptFooter: string;

    @Column({ name: 'invoice_notes', type: 'text', nullable: true })
    invoiceNotes: string;

    @Column({ name: 'invoice_payment_days', default: 14 })
    invoicePaymentDays: number;

    // GDPR
    @Column({ name: 'gdpr_data_retention_days', default: 1095 })
    gdprDataRetentionDays: number;

    @Column({ name: 'gdpr_consent_text', type: 'text', nullable: true })
    gdprConsentText: string;

    // Active status (for multi-branch support in the future)
    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
