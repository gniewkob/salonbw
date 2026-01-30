import {
    IsString,
    IsOptional,
    IsNumber,
    IsBoolean,
    IsArray,
    IsEnum,
    IsDateString,
    Min,
    Max,
    Length,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
    LoyaltyTransactionType,
    LoyaltyTransactionSource,
    RewardType,
} from '../entities/loyalty.entity';

// Tier threshold DTO
class TierThresholdDto {
    @IsString()
    @Length(1, 50)
    name: string;

    @IsNumber()
    @Min(0)
    minPoints: number;

    @IsNumber()
    @Min(1)
    @Max(5)
    multiplier: number;
}

// Program DTOs
export class CreateLoyaltyProgramDto {
    @IsString()
    @Length(1, 100)
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    pointsPerCurrency?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    minPointsPerVisit?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    maxPointsPerVisit?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    birthdayBonusPoints?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    referralBonusPoints?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    signupBonusPoints?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    pointsValueCurrency?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    minPointsRedemption?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    pointsExpireMonths?: number;

    @IsOptional()
    @IsBoolean()
    enableTiers?: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TierThresholdDto)
    tierThresholds?: TierThresholdDto[];
}

export class UpdateLoyaltyProgramDto {
    @IsOptional()
    @IsString()
    @Length(1, 100)
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    pointsPerCurrency?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    minPointsPerVisit?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    maxPointsPerVisit?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    birthdayBonusPoints?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    referralBonusPoints?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    signupBonusPoints?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    pointsValueCurrency?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    minPointsRedemption?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    pointsExpireMonths?: number;

    @IsOptional()
    @IsBoolean()
    enableTiers?: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TierThresholdDto)
    tierThresholds?: TierThresholdDto[];

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

// Reward DTOs
export class CreateRewardDto {
    @IsString()
    @Length(1, 100)
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsEnum(RewardType)
    type: RewardType;

    @IsNumber()
    @Min(1)
    pointsCost: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    discountPercent?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    discountAmount?: number;

    @IsOptional()
    @IsNumber()
    serviceId?: number;

    @IsOptional()
    @IsNumber()
    productId?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    giftCardValue?: number;

    @IsOptional()
    @IsDateString()
    availableFrom?: string;

    @IsOptional()
    @IsDateString()
    availableUntil?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    maxRedemptions?: number;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsOptional()
    @IsNumber()
    sortOrder?: number;
}

export class UpdateRewardDto {
    @IsOptional()
    @IsString()
    @Length(1, 100)
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    pointsCost?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    discountPercent?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    discountAmount?: number;

    @IsOptional()
    @IsNumber()
    serviceId?: number;

    @IsOptional()
    @IsNumber()
    productId?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    giftCardValue?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsDateString()
    availableFrom?: string;

    @IsOptional()
    @IsDateString()
    availableUntil?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    maxRedemptions?: number;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsOptional()
    @IsNumber()
    sortOrder?: number;
}

// Transaction DTOs
export class AwardPointsDto {
    @IsNumber()
    userId: number;

    @IsNumber()
    @Min(1)
    points: number;

    @IsEnum(LoyaltyTransactionSource)
    source: LoyaltyTransactionSource;

    @IsOptional()
    @IsNumber()
    appointmentId?: number;

    @IsOptional()
    @IsNumber()
    referralUserId?: number;

    @IsOptional()
    @IsString()
    description?: string;
}

export class AdjustPointsDto {
    @IsNumber()
    points: number; // Can be positive or negative

    @IsString()
    description: string;
}

export class RedeemRewardDto {
    @IsNumber()
    rewardId: number;
}

export class UseRedemptionDto {
    @IsString()
    redemptionCode: string;

    @IsOptional()
    @IsNumber()
    appointmentId?: number;
}

// Query DTOs
export class LoyaltyTransactionQueryDto {
    @IsOptional()
    @IsNumber()
    userId?: number;

    @IsOptional()
    @IsEnum(LoyaltyTransactionType)
    type?: LoyaltyTransactionType;

    @IsOptional()
    @IsEnum(LoyaltyTransactionSource)
    source?: LoyaltyTransactionSource;

    @IsOptional()
    @IsDateString()
    from?: string;

    @IsOptional()
    @IsDateString()
    to?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    page?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number;
}

export class RewardQueryDto {
    @IsOptional()
    @IsEnum(RewardType)
    type?: RewardType;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(1)
    page?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number;
}

// Response DTOs
export class LoyaltyBalanceResponse {
    userId: number;
    userName: string;
    currentBalance: number;
    totalPointsEarned: number;
    totalPointsSpent: number;
    lifetimeTierPoints: number;
    currentTier: string | null;
    tierMultiplier: number;
    pointsValue: number; // Monetary value of current points
}

export class LoyaltyStatsResponse {
    totalMembers: number;
    activeMembers: number;
    totalPointsIssued: number;
    totalPointsRedeemed: number;
    totalRewardsRedeemed: number;
    outstandingPoints: number;
    outstandingValue: number;
}
