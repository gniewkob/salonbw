import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MessageTemplate, TemplateType, MessageChannel } from './entities/message-template.entity';
import { SmsLog, SmsStatus } from './entities/sms-log.entity';
import {
    CreateTemplateDto,
    UpdateTemplateDto,
    SendSmsDto,
    SendBulkSmsDto,
    SendFromTemplateDto,
    SmsHistoryFilterDto,
} from './dto/sms.dto';
import { User } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';

interface SmsApiResponse {
    id?: string;
    status?: string;
    error?: string;
    parts?: number;
    cost?: number;
}

@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);
    private readonly apiUrl: string;
    private readonly apiToken: string;
    private readonly senderName: string;
    private readonly isEnabled: boolean;

    constructor(
        @InjectRepository(MessageTemplate)
        private readonly templateRepository: Repository<MessageTemplate>,
        @InjectRepository(SmsLog)
        private readonly smsLogRepository: Repository<SmsLog>,
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        private readonly configService: ConfigService,
        private readonly logService: LogService,
    ) {
        this.apiUrl = this.configService.get<string>('SMSAPI_URL', 'https://api.smsapi.pl/sms.do');
        this.apiToken = this.configService.get<string>('SMSAPI_TOKEN', '');
        this.senderName = this.configService.get<string>('SMSAPI_SENDER', 'SalonBW');
        this.isEnabled = this.configService.get<boolean>('SMSAPI_ENABLED', false);
    }

    // Template management
    async findAllTemplates(options?: {
        type?: TemplateType;
        channel?: MessageChannel;
        isActive?: boolean;
    }): Promise<MessageTemplate[]> {
        const where: Record<string, unknown> = {};
        if (options?.type) where.type = options.type;
        if (options?.channel) where.channel = options.channel;
        if (options?.isActive !== undefined) where.isActive = options.isActive;

        return this.templateRepository.find({
            where,
            order: { type: 'ASC', name: 'ASC' },
        });
    }

    async findTemplateById(id: number): Promise<MessageTemplate> {
        const template = await this.templateRepository.findOne({ where: { id } });
        if (!template) {
            throw new NotFoundException(`Szablon o ID ${id} nie został znaleziony`);
        }
        return template;
    }

    async findDefaultTemplate(type: TemplateType, channel: MessageChannel = MessageChannel.SMS): Promise<MessageTemplate | null> {
        return this.templateRepository.findOne({
            where: { type, channel, isDefault: true, isActive: true },
        });
    }

    async createTemplate(dto: CreateTemplateDto, actor: User): Promise<MessageTemplate> {
        // If setting as default, unset other defaults of same type/channel
        if (dto.isDefault) {
            await this.templateRepository.update(
                { type: dto.type, channel: dto.channel ?? MessageChannel.SMS, isDefault: true },
                { isDefault: false },
            );
        }

        const template = this.templateRepository.create({
            ...dto,
            availableVariables: dto.availableVariables ?? this.getDefaultVariables(dto.type),
        });

        const saved = await this.templateRepository.save(template);

        await this.logService.logAction(actor, LogAction.SERVICE_CREATED, {
            entity: 'message_template',
            templateId: saved.id,
            name: dto.name,
            type: dto.type,
        });

        return saved;
    }

    async updateTemplate(id: number, dto: UpdateTemplateDto, actor: User): Promise<MessageTemplate> {
        const template = await this.findTemplateById(id);

        // If setting as default, unset other defaults
        if (dto.isDefault && !template.isDefault) {
            await this.templateRepository.update(
                { type: template.type, channel: template.channel, isDefault: true },
                { isDefault: false },
            );
        }

        Object.assign(template, dto);
        const saved = await this.templateRepository.save(template);

        await this.logService.logAction(actor, LogAction.SERVICE_UPDATED, {
            entity: 'message_template',
            templateId: id,
            changes: dto,
        });

        return saved;
    }

    async deleteTemplate(id: number, actor: User): Promise<void> {
        const template = await this.findTemplateById(id);
        await this.templateRepository.remove(template);

        await this.logService.logAction(actor, LogAction.SERVICE_DELETED, {
            entity: 'message_template',
            templateId: id,
            name: template.name,
        });
    }

    // SMS sending
    // actor is optional for system-generated automatic messages
    async sendSms(dto: SendSmsDto, actor?: User | null): Promise<SmsLog> {
        const log = this.smsLogRepository.create({
            recipient: this.normalizePhoneNumber(dto.recipient),
            channel: MessageChannel.SMS,
            content: dto.content,
            status: SmsStatus.Pending,
            templateId: dto.templateId,
            recipientId: dto.recipientId,
            appointmentId: dto.appointmentId,
            sentById: actor?.id,
        });

        await this.smsLogRepository.save(log);

        if (this.isEnabled) {
            try {
                const result = await this.sendViaSmsApi(log.recipient, dto.content);
                log.externalId = result.id ?? null;
                log.status = result.status === 'ok' ? SmsStatus.Sent : SmsStatus.Failed;
                log.errorMessage = result.error ?? null;
                log.partsCount = result.parts ?? 1;
                log.cost = result.cost ?? 0;
                log.sentAt = new Date();
            } catch (error) {
                log.status = SmsStatus.Failed;
                log.errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.logger.error(`Failed to send SMS: ${log.errorMessage}`);
            }
        } else {
            // Development mode - simulate success
            log.status = SmsStatus.Sent;
            log.sentAt = new Date();
            log.partsCount = Math.ceil(dto.content.length / 160);
            this.logger.log(`[DEV] SMS would be sent to ${log.recipient}: ${dto.content}`);
        }

        return this.smsLogRepository.save(log);
    }

    async sendBulkSms(dto: SendBulkSmsDto, actor?: User | null): Promise<SmsLog[]> {
        const results: SmsLog[] = [];

        for (const recipient of dto.recipients) {
            const log = await this.sendSms(
                {
                    recipient,
                    content: dto.content,
                    templateId: dto.templateId,
                },
                actor,
            );
            results.push(log);
        }

        return results;
    }

    async sendFromTemplate(dto: SendFromTemplateDto, actor?: User | null): Promise<SmsLog> {
        const template = await this.findTemplateById(dto.templateId);

        if (!template.isActive) {
            throw new BadRequestException('Szablon jest nieaktywny');
        }

        let content = template.content;

        // Replace variables
        if (dto.variables) {
            for (const [key, value] of Object.entries(dto.variables)) {
                content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
            }
        }

        // If appointment ID provided, auto-fill appointment variables
        if (dto.appointmentId) {
            const appointment = await this.appointmentRepository.findOne({
                where: { id: dto.appointmentId },
                relations: ['client', 'service', 'employee'],
            });

            if (appointment) {
                const appointmentVars = this.getAppointmentVariables(appointment);
                for (const [key, value] of Object.entries(appointmentVars)) {
                    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
                }
            }
        }

        return this.sendSms(
            {
                recipient: dto.recipient,
                content,
                templateId: dto.templateId,
                recipientId: dto.recipientId,
                appointmentId: dto.appointmentId,
            },
            actor,
        );
    }

    // Send appointment reminder
    async sendAppointmentReminder(appointmentId: number, actor: User): Promise<SmsLog | null> {
        const appointment = await this.appointmentRepository.findOne({
            where: { id: appointmentId },
            relations: ['client', 'service', 'employee'],
        });

        if (!appointment || !appointment.client?.phone) {
            return null;
        }

        const template = await this.findDefaultTemplate(
            TemplateType.AppointmentReminder,
            MessageChannel.SMS,
        );

        if (!template) {
            this.logger.warn('No default appointment reminder template found');
            return null;
        }

        return this.sendFromTemplate(
            {
                templateId: template.id,
                recipient: appointment.client.phone,
                recipientId: appointment.client.id,
                appointmentId: appointment.id,
            },
            actor,
        );
    }

    // History
    async getHistory(filter: SmsHistoryFilterDto): Promise<{
        items: SmsLog[];
        total: number;
        page: number;
        limit: number;
    }> {
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 20;
        const skip = (page - 1) * limit;

        const qb = this.smsLogRepository
            .createQueryBuilder('log')
            .leftJoinAndSelect('log.recipientUser', 'recipient')
            .leftJoinAndSelect('log.template', 'template')
            .leftJoinAndSelect('log.sentBy', 'sentBy')
            .orderBy('log.createdAt', 'DESC');

        if (filter.channel) {
            qb.andWhere('log.channel = :channel', { channel: filter.channel });
        }
        if (filter.status) {
            qb.andWhere('log.status = :status', { status: filter.status });
        }
        if (filter.recipientId) {
            qb.andWhere('log.recipientId = :recipientId', { recipientId: filter.recipientId });
        }
        if (filter.appointmentId) {
            qb.andWhere('log.appointmentId = :appointmentId', { appointmentId: filter.appointmentId });
        }
        if (filter.from) {
            qb.andWhere('log.createdAt >= :from', { from: new Date(filter.from) });
        }
        if (filter.to) {
            qb.andWhere('log.createdAt <= :to', { to: new Date(filter.to) });
        }

        const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

        return { items, total, page, limit };
    }

    async getStats(from: Date, to: Date): Promise<{
        totalSent: number;
        totalDelivered: number;
        totalFailed: number;
        totalCost: number;
        byChannel: Record<string, number>;
    }> {
        const logs = await this.smsLogRepository.find({
            where: { createdAt: Between(from, to) },
        });

        const stats = {
            totalSent: 0,
            totalDelivered: 0,
            totalFailed: 0,
            totalCost: 0,
            byChannel: {} as Record<string, number>,
        };

        for (const log of logs) {
            if (log.status === SmsStatus.Sent || log.status === SmsStatus.Delivered) {
                stats.totalSent++;
            }
            if (log.status === SmsStatus.Delivered) {
                stats.totalDelivered++;
            }
            if (log.status === SmsStatus.Failed || log.status === SmsStatus.Rejected) {
                stats.totalFailed++;
            }
            stats.totalCost += Number(log.cost);
            stats.byChannel[log.channel] = (stats.byChannel[log.channel] ?? 0) + 1;
        }

        return stats;
    }

    // Private helpers
    private async sendViaSmsApi(recipient: string, content: string): Promise<SmsApiResponse> {
        const params = new URLSearchParams({
            to: recipient,
            message: content,
            from: this.senderName,
            format: 'json',
            encoding: 'utf-8',
        });

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiToken}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            return {
                status: 'error',
                error: data.error || data.message || 'Unknown API error',
            };
        }

        return {
            id: data.list?.[0]?.id,
            status: 'ok',
            parts: data.list?.[0]?.parts ?? 1,
            cost: data.list?.[0]?.points ?? 0,
        };
    }

    private normalizePhoneNumber(phone: string): string {
        // Remove all non-digits
        let cleaned = phone.replace(/\D/g, '');

        // Add Polish country code if not present
        if (cleaned.length === 9) {
            cleaned = '48' + cleaned;
        }

        return cleaned;
    }

    private getDefaultVariables(type: TemplateType): string[] {
        const common = ['client_name', 'salon_name', 'salon_phone'];

        switch (type) {
            case TemplateType.AppointmentReminder:
            case TemplateType.AppointmentConfirmation:
            case TemplateType.AppointmentCancellation:
                return [...common, 'service_name', 'date', 'time', 'employee_name'];
            case TemplateType.BirthdayWish:
                return common;
            case TemplateType.FollowUp:
                return [...common, 'service_name', 'employee_name'];
            default:
                return common;
        }
    }

    private getAppointmentVariables(appointment: Appointment): Record<string, string> {
        const startTime = new Date(appointment.startTime);

        return {
            client_name: appointment.client?.name ?? '',
            service_name: appointment.service?.name ?? '',
            employee_name: appointment.employee?.name ?? '',
            date: startTime.toLocaleDateString('pl-PL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }),
            time: startTime.toLocaleTimeString('pl-PL', {
                hour: '2-digit',
                minute: '2-digit',
            }),
            salon_name: this.configService.get<string>('SALON_NAME', 'SalonBW'),
            salon_phone: this.configService.get<string>('SALON_PHONE', ''),
        };
    }
}
