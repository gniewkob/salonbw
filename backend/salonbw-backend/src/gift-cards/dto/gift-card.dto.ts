import {
    IsString,
    IsOptional,
    IsNumber,
    IsEmail,
    IsEnum,
    IsArray,
    IsDateString,
    Min,
    Max,
    Length,
} from 'class-validator';
import { GiftCardStatus, GiftCardTransactionType } from '../entities/gift-card.entity';

export class CreateGiftCardDto {
    @IsNumber()
    @Min(1)
    initialValue: number;

    @IsOptional()
    @IsString()
    @Length(3, 3)
    currency?: string;

    @IsDateString()
    validFrom: string;

    @IsDateString()
    validUntil: string;

    @IsOptional()
    @IsNumber()
    purchasedById?: number;

    @IsOptional()
    @IsString()
    @Length(0, 255)
    purchaserName?: string;

    @IsOptional()
    @IsEmail()
    purchaserEmail?: string;

    @IsOptional()
    @IsNumber()
    recipientId?: number;

    @IsOptional()
    @IsString()
    @Length(0, 255)
    recipientName?: string;

    @IsOptional()
    @IsEmail()
    recipientEmail?: string;

    @IsOptional()
    @IsString()
    message?: string;

    @IsOptional()
    @IsString()
    @Length(0, 50)
    templateId?: string;

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    allowedServices?: number[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    minPurchaseAmount?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateGiftCardDto {
    @IsOptional()
    @IsEnum(GiftCardStatus)
    status?: GiftCardStatus;

    @IsOptional()
    @IsDateString()
    validUntil?: string;

    @IsOptional()
    @IsNumber()
    recipientId?: number;

    @IsOptional()
    @IsString()
    @Length(0, 255)
    recipientName?: string;

    @IsOptional()
    @IsEmail()
    recipientEmail?: string;

    @IsOptional()
    @IsString()
    message?: string;

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    allowedServices?: number[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    minPurchaseAmount?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class RedeemGiftCardDto {
    @IsString()
    code: string;

    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsOptional()
    @IsNumber()
    appointmentId?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class AdjustBalanceDto {
    @IsNumber()
    amount: number;

    @IsString()
    notes: string;
}

export class GiftCardQueryDto {
    @IsOptional()
    @IsEnum(GiftCardStatus)
    status?: GiftCardStatus;

    @IsOptional()
    @IsNumber()
    recipientId?: number;

    @IsOptional()
    @IsNumber()
    purchasedById?: number;

    @IsOptional()
    @IsString()
    code?: string;

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

export class ValidateGiftCardResponse {
    valid: boolean;
    reason?: string;
    giftCard?: {
        code: string;
        currentBalance: number;
        validUntil: string;
        allowedServices: number[];
    };
}
