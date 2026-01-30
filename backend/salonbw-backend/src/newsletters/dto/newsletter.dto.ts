import {
    IsString,
    IsOptional,
    IsEnum,
    IsArray,
    IsNumber,
    IsDateString,
    MaxLength,
    IsObject,
} from 'class-validator';
import { NewsletterChannel, NewsletterStatus } from '../entities/newsletter.entity';
import { RecipientStatus } from '../entities/newsletter-recipient.entity';

// Recipient filter criteria
export class RecipientFilterDto {
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    groupIds?: number[];

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    tagIds?: number[];

    @IsOptional()
    @IsEnum(['male', 'female', 'other'])
    gender?: 'male' | 'female' | 'other';

    @IsOptional()
    @IsNumber()
    ageMin?: number;

    @IsOptional()
    @IsNumber()
    ageMax?: number;

    @IsOptional()
    hasEmailConsent?: boolean;

    @IsOptional()
    hasSmsConsent?: boolean;

    @IsOptional()
    @IsDateString()
    lastVisitAfter?: string;

    @IsOptional()
    @IsDateString()
    lastVisitBefore?: string;
}

export class CreateNewsletterDto {
    @IsString()
    @MaxLength(200)
    name: string;

    @IsString()
    @MaxLength(200)
    subject: string;

    @IsString()
    content: string;

    @IsOptional()
    @IsString()
    plainTextContent?: string;

    @IsOptional()
    @IsEnum(NewsletterChannel)
    channel?: NewsletterChannel;

    @IsOptional()
    @IsObject()
    recipientFilter?: RecipientFilterDto;

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    recipientIds?: number[];

    @IsOptional()
    @IsDateString()
    scheduledAt?: string;
}

export class UpdateNewsletterDto {
    @IsOptional()
    @IsString()
    @MaxLength(200)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    subject?: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsString()
    plainTextContent?: string;

    @IsOptional()
    @IsEnum(NewsletterChannel)
    channel?: NewsletterChannel;

    @IsOptional()
    @IsObject()
    recipientFilter?: RecipientFilterDto;

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    recipientIds?: number[];

    @IsOptional()
    @IsDateString()
    scheduledAt?: string;
}

export class NewsletterResponseDto {
    id: number;
    name: string;
    subject: string;
    content: string;
    plainTextContent: string | null;
    channel: NewsletterChannel;
    status: NewsletterStatus;
    scheduledAt: string | null;
    sentAt: string | null;
    totalRecipients: number;
    sentCount: number;
    deliveredCount: number;
    failedCount: number;
    openedCount: number;
    clickedCount: number;
    recipientFilter: RecipientFilterDto | null;
    recipientIds: number[] | null;
    createdBy: { id: number; name: string } | null;
    sentBy: { id: number; name: string } | null;
    createdAt: string;
    updatedAt: string;
}

export class NewsletterRecipientResponseDto {
    id: number;
    recipientId: number | null;
    recipientEmail: string;
    recipientName: string | null;
    status: RecipientStatus;
    sentAt: string | null;
    deliveredAt: string | null;
    openedAt: string | null;
    clickedAt: string | null;
    errorMessage: string | null;
}

export class NewsletterStatsDto {
    totalNewsletters: number;
    sentNewsletters: number;
    draftNewsletters: number;
    totalRecipients: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    averageOpenRate: number;
    averageClickRate: number;
}

export class SendNewsletterDto {
    @IsOptional()
    @IsDateString()
    scheduledAt?: string;
}

export class PreviewRecipientsDto {
    @IsOptional()
    @IsObject()
    recipientFilter?: RecipientFilterDto;

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    recipientIds?: number[];
}

export class RecipientPreviewResponseDto {
    totalCount: number;
    recipients: Array<{
        id: number;
        name: string;
        email: string;
    }>;
}
