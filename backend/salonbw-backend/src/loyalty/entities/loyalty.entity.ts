import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

// Loyalty Program Configuration
@Entity('loyalty_programs')
export class LoyaltyProgram {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    // Points earning rules
    @Column({ name: 'points_per_currency', type: 'decimal', precision: 10, scale: 2, default: 1 })
    pointsPerCurrency: number; // e.g., 1 point per 1 PLN spent

    @Column({ name: 'min_points_per_visit', default: 0 })
    minPointsPerVisit: number;

    @Column({ name: 'max_points_per_visit', nullable: true })
    maxPointsPerVisit: number;

    @Column({ name: 'birthday_bonus_points', default: 0 })
    birthdayBonusPoints: number;

    @Column({ name: 'referral_bonus_points', default: 0 })
    referralBonusPoints: number;

    @Column({ name: 'signup_bonus_points', default: 0 })
    signupBonusPoints: number;

    // Points spending rules
    @Column({ name: 'points_value_currency', type: 'decimal', precision: 10, scale: 4, default: 0.01 })
    pointsValueCurrency: number; // e.g., 1 point = 0.01 PLN

    @Column({ name: 'min_points_redemption', default: 100 })
    minPointsRedemption: number;

    // Point expiration
    @Column({ name: 'points_expire_months', nullable: true })
    pointsExpireMonths: number; // null = never expire

    // Tiers
    @Column({ name: 'enable_tiers', default: false })
    enableTiers: boolean;

    @Column({ name: 'tier_thresholds', type: 'jsonb', default: () => `'[]'` })
    tierThresholds: Array<{ name: string; minPoints: number; multiplier: number }>;

    // Status
    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}

// Client's loyalty balance
@Entity('loyalty_balances')
export class LoyaltyBalance {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id' })
    userId: number;

    @Column({ name: 'total_points_earned', default: 0 })
    totalPointsEarned: number;

    @Column({ name: 'total_points_spent', default: 0 })
    totalPointsSpent: number;

    @Column({ name: 'current_balance', default: 0 })
    currentBalance: number;

    @Column({ name: 'lifetime_tier_points', default: 0 })
    lifetimeTierPoints: number;

    @Column({ name: 'current_tier', length: 50, nullable: true })
    currentTier: string;

    @Column({ name: 'tier_multiplier', type: 'decimal', precision: 3, scale: 2, default: 1.0 })
    tierMultiplier: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}

export enum LoyaltyTransactionType {
    Earn = 'earn',
    Spend = 'spend',
    Expire = 'expire',
    Adjust = 'adjust',
    Bonus = 'bonus',
    Referral = 'referral',
}

export enum LoyaltyTransactionSource {
    Appointment = 'appointment',
    ProductPurchase = 'product_purchase',
    Reward = 'reward',
    Birthday = 'birthday',
    Referral = 'referral',
    Signup = 'signup',
    Manual = 'manual',
    Expiration = 'expiration',
}

@Entity('loyalty_transactions')
export class LoyaltyTransaction {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id' })
    userId: number;

    @Column({
        type: 'enum',
        enum: LoyaltyTransactionType,
    })
    type: LoyaltyTransactionType;

    @Column({
        type: 'enum',
        enum: LoyaltyTransactionSource,
    })
    source: LoyaltyTransactionSource;

    // Positive for earning, negative for spending
    @Column()
    points: number;

    @Column({ name: 'balance_after' })
    balanceAfter: number;

    // Reference IDs
    @Column({ name: 'appointment_id', nullable: true })
    appointmentId: number;

    @Column({ name: 'reward_id', nullable: true })
    rewardId: number;

    @Column({ name: 'referral_user_id', nullable: true })
    referralUserId: number;

    // Metadata
    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'performed_by_id', nullable: true })
    performedById: number;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'performed_by_id' })
    performedBy: User;

    // Expiration tracking
    @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
    expiresAt: Date | null;

    @Column({ name: 'is_expired', default: false })
    isExpired: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}

// Rewards catalog
export enum RewardType {
    Discount = 'discount',
    FreeService = 'free_service',
    FreeProduct = 'free_product',
    GiftCard = 'gift_card',
    Custom = 'custom',
}

@Entity('loyalty_rewards')
export class LoyaltyReward {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: RewardType,
    })
    type: RewardType;

    @Column({ name: 'points_cost' })
    pointsCost: number;

    // For discount rewards
    @Column({ name: 'discount_percent', nullable: true })
    discountPercent: number;

    @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
    discountAmount: number;

    // For free service/product rewards
    @Column({ name: 'service_id', nullable: true })
    serviceId: number;

    @Column({ name: 'product_id', nullable: true })
    productId: number;

    // For gift card rewards
    @Column({ name: 'gift_card_value', type: 'decimal', precision: 10, scale: 2, nullable: true })
    giftCardValue: number;

    // Availability
    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'available_from', type: 'date', nullable: true })
    availableFrom: Date;

    @Column({ name: 'available_until', type: 'date', nullable: true })
    availableUntil: Date;

    @Column({ name: 'max_redemptions', nullable: true })
    maxRedemptions: number;

    @Column({ name: 'current_redemptions', default: 0 })
    currentRedemptions: number;

    // Display
    @Column({ name: 'image_url', length: 500, nullable: true })
    imageUrl: string;

    @Column({ name: 'sort_order', default: 0 })
    sortOrder: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}

// Track reward redemptions
@Entity('loyalty_reward_redemptions')
export class LoyaltyRewardRedemption {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id' })
    userId: number;

    @ManyToOne(() => LoyaltyReward)
    @JoinColumn({ name: 'reward_id' })
    reward: LoyaltyReward;

    @Column({ name: 'reward_id' })
    rewardId: number;

    @Column({ name: 'points_spent' })
    pointsSpent: number;

    @Column({ name: 'transaction_id' })
    transactionId: number;

    // Status
    @Column({ length: 20, default: 'active' })
    status: string; // active, used, expired, cancelled

    @Column({ name: 'used_at', type: 'timestamp', nullable: true })
    usedAt: Date;

    @Column({ name: 'used_appointment_id', nullable: true })
    usedAppointmentId: number;

    @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
    expiresAt: Date;

    // Code for redemption voucher
    @Column({ name: 'redemption_code', length: 20, unique: true })
    redemptionCode: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'processed_by_id' })
    processedBy: User;

    @Column({ name: 'processed_by_id', nullable: true })
    processedById: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
