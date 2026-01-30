import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsArray, MinLength, MaxLength } from 'class-validator';
import { TemplateType, MessageChannel } from '../entities/message-template.entity';

export class CreateTemplateDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    name: string;

    @IsEnum(TemplateType)
    type: TemplateType;

    @IsEnum(MessageChannel)
    @IsOptional()
    channel?: MessageChannel;

    @IsString()
    @MinLength(1)
    content: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    subject?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    availableVariables?: string[];
}

export class UpdateTemplateDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    @IsOptional()
    name?: string;

    @IsEnum(TemplateType)
    @IsOptional()
    type?: TemplateType;

    @IsEnum(MessageChannel)
    @IsOptional()
    channel?: MessageChannel;

    @IsString()
    @MinLength(1)
    @IsOptional()
    content?: string;

    @IsString()
    @MaxLength(200)
    @IsOptional()
    subject?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    availableVariables?: string[];
}

export class SendSmsDto {
    @IsString()
    recipient: string; // Phone number

    @IsString()
    @MinLength(1)
    content: string;

    @IsNumber()
    @IsOptional()
    templateId?: number;

    @IsNumber()
    @IsOptional()
    recipientId?: number;

    @IsNumber()
    @IsOptional()
    appointmentId?: number;
}

export class SendBulkSmsDto {
    @IsArray()
    @IsString({ each: true })
    recipients: string[];

    @IsString()
    @MinLength(1)
    content: string;

    @IsNumber()
    @IsOptional()
    templateId?: number;
}

export class SendFromTemplateDto {
    @IsNumber()
    templateId: number;

    @IsString()
    recipient: string;

    @IsNumber()
    @IsOptional()
    recipientId?: number;

    @IsNumber()
    @IsOptional()
    appointmentId?: number;

    @IsOptional()
    variables?: Record<string, string>;
}

export class SmsHistoryFilterDto {
    @IsEnum(MessageChannel)
    @IsOptional()
    channel?: MessageChannel;

    @IsString()
    @IsOptional()
    status?: string;

    @IsNumber()
    @IsOptional()
    recipientId?: number;

    @IsNumber()
    @IsOptional()
    appointmentId?: number;

    @IsString()
    @IsOptional()
    from?: string;

    @IsString()
    @IsOptional()
    to?: string;

    @IsNumber()
    @IsOptional()
    page?: number;

    @IsNumber()
    @IsOptional()
    limit?: number;
}
