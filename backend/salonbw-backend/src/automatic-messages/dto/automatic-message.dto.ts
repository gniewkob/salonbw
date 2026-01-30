import {
    IsString,
    IsEnum,
    IsInt,
    IsBoolean,
    IsOptional,
    IsArray,
    MaxLength,
    Min,
    Max,
    Matches,
} from 'class-validator';
import {
    AutomaticMessageTrigger,
    MessageChannel,
} from '../entities/automatic-message-rule.entity';

export class CreateAutomaticMessageRuleDto {
    @IsString()
    @MaxLength(100)
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsEnum(AutomaticMessageTrigger)
    trigger: AutomaticMessageTrigger;

    @IsOptional()
    @IsEnum(MessageChannel)
    channel?: MessageChannel;

    @IsOptional()
    @IsInt()
    @Min(-168) // Up to 7 days before
    @Max(168) // Up to 7 days after
    offsetHours?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(365)
    inactivityDays?: number;

    @IsOptional()
    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
        message: 'sendWindowStart must be in HH:mm:ss format',
    })
    sendWindowStart?: string;

    @IsOptional()
    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
        message: 'sendWindowEnd must be in HH:mm:ss format',
    })
    sendWindowEnd?: string;

    @IsOptional()
    @IsInt()
    templateId?: number;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    serviceIds?: number[];

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    employeeIds?: number[];

    @IsOptional()
    @IsBoolean()
    requireSmsConsent?: boolean;

    @IsOptional()
    @IsBoolean()
    requireEmailConsent?: boolean;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateAutomaticMessageRuleDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(AutomaticMessageTrigger)
    trigger?: AutomaticMessageTrigger;

    @IsOptional()
    @IsEnum(MessageChannel)
    channel?: MessageChannel;

    @IsOptional()
    @IsInt()
    @Min(-168)
    @Max(168)
    offsetHours?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(365)
    inactivityDays?: number;

    @IsOptional()
    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
        message: 'sendWindowStart must be in HH:mm:ss format',
    })
    sendWindowStart?: string;

    @IsOptional()
    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
        message: 'sendWindowEnd must be in HH:mm:ss format',
    })
    sendWindowEnd?: string;

    @IsOptional()
    @IsInt()
    templateId?: number | null;

    @IsOptional()
    @IsString()
    content?: string | null;

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    serviceIds?: number[] | null;

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    employeeIds?: number[] | null;

    @IsOptional()
    @IsBoolean()
    requireSmsConsent?: boolean;

    @IsOptional()
    @IsBoolean()
    requireEmailConsent?: boolean;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class AutomaticMessageRuleResponseDto {
    id: number;
    name: string;
    description: string | null;
    trigger: AutomaticMessageTrigger;
    channel: MessageChannel;
    offsetHours: number;
    inactivityDays: number | null;
    sendWindowStart: string;
    sendWindowEnd: string;
    templateId: number | null;
    templateName?: string | null;
    content: string | null;
    serviceIds: number[] | null;
    employeeIds: number[] | null;
    requireSmsConsent: boolean;
    requireEmailConsent: boolean;
    isActive: boolean;
    sentCount: number;
    lastSentAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export class ProcessAutomaticMessagesResultDto {
    trigger: AutomaticMessageTrigger;
    processed: number;
    sent: number;
    skipped: number;
    errors: number;
    details?: string[];
}
