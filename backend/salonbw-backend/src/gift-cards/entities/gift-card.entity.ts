import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

export enum GiftCardStatus {
    Active = 'active',
    Used = 'used',
    Expired = 'expired',
    Cancelled = 'cancelled',
}

@Entity('gift_cards')
export class GiftCard {
    @PrimaryGeneratedColumn()
    id: number;

    // Unique code for redemption
    @Column({ length: 20, unique: true })
    code: string;

    // Value
    @Column({ name: 'initial_value', type: 'decimal', precision: 10, scale: 2 })
    initialValue: number;

    @Column({
        name: 'current_balance',
        type: 'decimal',
        precision: 10,
        scale: 2,
    })
    currentBalance: number;

    @Column({ length: 3, default: 'PLN' })
    currency: string;

    // Status
    @Column({
        type: 'enum',
        enum: GiftCardStatus,
        default: GiftCardStatus.Active,
    })
    status: GiftCardStatus;

    // Validity period
    @Column({ name: 'valid_from', type: 'date' })
    validFrom: Date;

    @Column({ name: 'valid_until', type: 'date' })
    validUntil: Date;

    // Purchaser info (can be null for promotional cards)
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'purchased_by_id' })
    purchasedBy: User;

    @Column({ name: 'purchased_by_id', nullable: true })
    purchasedById: number;

    @Column({ name: 'purchaser_name', length: 255, nullable: true })
    purchaserName: string;

    @Column({ name: 'purchaser_email', length: 255, nullable: true })
    purchaserEmail: string;

    // Recipient info
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'recipient_id' })
    recipient: User;

    @Column({ name: 'recipient_id', nullable: true })
    recipientId: number;

    @Column({ name: 'recipient_name', length: 255, nullable: true })
    recipientName: string;

    @Column({ name: 'recipient_email', length: 255, nullable: true })
    recipientEmail: string;

    // Personal message
    @Column({ type: 'text', nullable: true })
    message: string;

    // Design/template
    @Column({ name: 'template_id', length: 50, nullable: true })
    templateId: string;

    // Restrictions
    @Column({
        name: 'allowed_services',
        type: 'jsonb',
        default: () => `'[]'`,
        comment:
            'Service IDs that this card can be used for. Empty = all services',
    })
    allowedServices: number[];

    @Column({
        name: 'min_purchase_amount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    minPurchaseAmount: number;

    // Metadata
    @Column({ type: 'text', nullable: true })
    notes: string;

    // Sale info
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'sold_by_id' })
    soldBy: User;

    @Column({ name: 'sold_by_id', nullable: true })
    soldById: number;

    @Column({ name: 'sold_at', type: 'timestamp', nullable: true })
    soldAt: Date;

    // Tracking
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @OneToMany(() => GiftCardTransaction, (t) => t.giftCard)
    transactions: GiftCardTransaction[];
}

export enum GiftCardTransactionType {
    Purchase = 'purchase',
    Redemption = 'redemption',
    Refund = 'refund',
    Adjustment = 'adjustment',
    Expiration = 'expiration',
}

@Entity('gift_card_transactions')
export class GiftCardTransaction {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => GiftCard, (gc) => gc.transactions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'gift_card_id' })
    giftCard: GiftCard;

    @Column({ name: 'gift_card_id' })
    giftCardId: number;

    @Column({
        type: 'enum',
        enum: GiftCardTransactionType,
    })
    type: GiftCardTransactionType;

    // Amount (positive for additions, negative for deductions)
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    // Balance after this transaction
    @Column({ name: 'balance_after', type: 'decimal', precision: 10, scale: 2 })
    balanceAfter: number;

    // Reference to appointment if redemption
    @Column({ name: 'appointment_id', nullable: true })
    appointmentId: number;

    // Who performed the transaction
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'performed_by_id' })
    performedBy: User;

    @Column({ name: 'performed_by_id', nullable: true })
    performedById: number;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
