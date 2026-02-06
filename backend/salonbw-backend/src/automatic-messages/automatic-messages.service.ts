import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan, IsNull, Not } from 'typeorm';
import {
    startOfDay,
    endOfDay,
    addHours,
    subHours,
    subDays,
    format,
    parse,
    isWithinInterval,
} from 'date-fns';
import {
    AutomaticMessageRule,
    AutomaticMessageTrigger,
    MessageChannel,
} from './entities/automatic-message-rule.entity';
import {
    CreateAutomaticMessageRuleDto,
    UpdateAutomaticMessageRuleDto,
    ProcessAutomaticMessagesResultDto,
} from './dto/automatic-message.dto';
import { SmsService } from '../sms/sms.service';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';

@Injectable()
export class AutomaticMessagesService {
    private readonly logger = new Logger(AutomaticMessagesService.name);

    constructor(
        @InjectRepository(AutomaticMessageRule)
        private readonly ruleRepository: Repository<AutomaticMessageRule>,
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly smsService: SmsService,
    ) {}

    async findAll(): Promise<AutomaticMessageRule[]> {
        return this.ruleRepository.find({
            relations: ['template', 'createdBy'],
            order: { trigger: 'ASC', name: 'ASC' },
        });
    }

    async findOne(id: number): Promise<AutomaticMessageRule> {
        const rule = await this.ruleRepository.findOne({
            where: { id },
            relations: ['template', 'createdBy'],
        });
        if (!rule) {
            throw new NotFoundException(`Rule with ID ${id} not found`);
        }
        return rule;
    }

    async create(
        dto: CreateAutomaticMessageRuleDto,
        createdById?: number,
    ): Promise<AutomaticMessageRule> {
        const rule = this.ruleRepository.create({
            ...dto,
            createdById,
        });
        return this.ruleRepository.save(rule);
    }

    async update(
        id: number,
        dto: UpdateAutomaticMessageRuleDto,
    ): Promise<AutomaticMessageRule> {
        const rule = await this.findOne(id);
        Object.assign(rule, dto);
        return this.ruleRepository.save(rule);
    }

    async remove(id: number): Promise<void> {
        const rule = await this.findOne(id);
        await this.ruleRepository.remove(rule);
    }

    async toggle(id: number): Promise<AutomaticMessageRule> {
        const rule = await this.findOne(id);
        rule.isActive = !rule.isActive;
        return this.ruleRepository.save(rule);
    }

    // Main processing method - called by cron job
    async processAllRules(): Promise<ProcessAutomaticMessagesResultDto[]> {
        const activeRules = await this.ruleRepository.find({
            where: { isActive: true },
            relations: ['template'],
        });

        const results: ProcessAutomaticMessagesResultDto[] = [];

        for (const rule of activeRules) {
            try {
                const result = await this.processRule(rule);
                results.push(result);
            } catch (error) {
                this.logger.error(
                    `Error processing rule ${rule.id}: ${error.message}`,
                    error.stack,
                );
                results.push({
                    trigger: rule.trigger,
                    processed: 0,
                    sent: 0,
                    skipped: 0,
                    errors: 1,
                    details: [error.message],
                });
            }
        }

        return results;
    }

    async processRule(
        rule: AutomaticMessageRule,
    ): Promise<ProcessAutomaticMessagesResultDto> {
        const now = new Date();
        const result: ProcessAutomaticMessagesResultDto = {
            trigger: rule.trigger,
            processed: 0,
            sent: 0,
            skipped: 0,
            errors: 0,
            details: [],
        };

        // Check if within send window
        if (
            !this.isWithinSendWindow(
                now,
                rule.sendWindowStart,
                rule.sendWindowEnd,
            )
        ) {
            result.details?.push('Outside send window');
            return result;
        }

        switch (rule.trigger) {
            case AutomaticMessageTrigger.AppointmentReminder:
                return this.processAppointmentReminders(rule);

            case AutomaticMessageTrigger.AppointmentConfirmation:
                // Handled immediately when appointment is created
                return result;

            case AutomaticMessageTrigger.FollowUp:
                return this.processFollowUps(rule);

            case AutomaticMessageTrigger.Birthday:
                return this.processBirthdays(rule);

            case AutomaticMessageTrigger.InactiveClient:
                return this.processInactiveClients(rule);

            case AutomaticMessageTrigger.ReviewRequest:
                return this.processReviewRequests(rule);

            default:
                result.details?.push(`Unknown trigger: ${rule.trigger}`);
                return result;
        }
    }

    private async processAppointmentReminders(
        rule: AutomaticMessageRule,
    ): Promise<ProcessAutomaticMessagesResultDto> {
        const result: ProcessAutomaticMessagesResultDto = {
            trigger: rule.trigger,
            processed: 0,
            sent: 0,
            skipped: 0,
            errors: 0,
            details: [],
        };

        const now = new Date();
        // Find appointments that should receive reminders
        // offsetHours is negative for "before" (e.g., -24 = 24h before)
        const targetTime = subHours(now, rule.offsetHours);
        const windowStart = subHours(targetTime, 1);
        const windowEnd = addHours(targetTime, 1);

        const appointments = await this.appointmentRepository.find({
            where: {
                startTime: Between(windowStart, windowEnd),
                status: AppointmentStatus.Scheduled,
                reminderSent: false,
            },
            relations: ['client', 'employee', 'service'],
        });

        result.processed = appointments.length;

        for (const appointment of appointments) {
            try {
                // Check filters
                if (
                    rule.serviceIds?.length &&
                    appointment.service &&
                    !rule.serviceIds.includes(appointment.service.id)
                ) {
                    result.skipped++;
                    continue;
                }
                if (
                    rule.employeeIds?.length &&
                    appointment.employee &&
                    !rule.employeeIds.includes(appointment.employee.id)
                ) {
                    result.skipped++;
                    continue;
                }

                // Check consent
                const client = appointment.client;
                if (!client?.phone) {
                    result.skipped++;
                    continue;
                }
                if (rule.requireSmsConsent && !client.smsConsent) {
                    result.skipped++;
                    continue;
                }

                // Send message
                const content = this.buildContent(rule, appointment);
                await this.smsService.sendSms({
                    recipient: client.phone,
                    content,
                    recipientId: client.id,
                    appointmentId: appointment.id,
                    templateId: rule.templateId ?? undefined,
                });

                // Mark as sent
                appointment.reminderSent = true;
                await this.appointmentRepository.save(appointment);

                result.sent++;
            } catch (error) {
                result.errors++;
                result.details?.push(
                    `Appointment ${appointment.id}: ${error.message}`,
                );
            }
        }

        // Update rule statistics
        if (result.sent > 0) {
            rule.sentCount += result.sent;
            rule.lastSentAt = now;
            await this.ruleRepository.save(rule);
        }

        return result;
    }

    private async processFollowUps(
        rule: AutomaticMessageRule,
    ): Promise<ProcessAutomaticMessagesResultDto> {
        const result: ProcessAutomaticMessagesResultDto = {
            trigger: rule.trigger,
            processed: 0,
            sent: 0,
            skipped: 0,
            errors: 0,
            details: [],
        };

        const now = new Date();
        // Find completed appointments that need follow-up
        const targetTime = subHours(now, rule.offsetHours);
        const windowStart = subHours(targetTime, 1);
        const windowEnd = addHours(targetTime, 1);

        const appointments = await this.appointmentRepository.find({
            where: {
                finalizedAt: Between(windowStart, windowEnd),
                status: AppointmentStatus.Completed,
            },
            relations: ['client', 'employee', 'service'],
        });

        result.processed = appointments.length;

        for (const appointment of appointments) {
            try {
                const client = appointment.client;
                if (!client?.phone) {
                    result.skipped++;
                    continue;
                }
                if (rule.requireSmsConsent && !client.smsConsent) {
                    result.skipped++;
                    continue;
                }

                const content = this.buildContent(rule, appointment);
                await this.smsService.sendSms({
                    recipient: client.phone,
                    content,
                    recipientId: client.id,
                    appointmentId: appointment.id,
                    templateId: rule.templateId ?? undefined,
                });

                result.sent++;
            } catch (error) {
                result.errors++;
                result.details?.push(
                    `Appointment ${appointment.id}: ${error.message}`,
                );
            }
        }

        if (result.sent > 0) {
            rule.sentCount += result.sent;
            rule.lastSentAt = now;
            await this.ruleRepository.save(rule);
        }

        return result;
    }

    private async processBirthdays(
        rule: AutomaticMessageRule,
    ): Promise<ProcessAutomaticMessagesResultDto> {
        const result: ProcessAutomaticMessagesResultDto = {
            trigger: rule.trigger,
            processed: 0,
            sent: 0,
            skipped: 0,
            errors: 0,
            details: [],
        };

        const now = new Date();
        const today = format(now, 'MM-dd');

        // Find clients with birthday today
        const clients = await this.userRepository
            .createQueryBuilder('user')
            .where('user.role = :role', { role: Role.Client })
            .andWhere('user.birthDate IS NOT NULL')
            .andWhere("TO_CHAR(user.birthDate, 'MM-DD') = :today", { today })
            .andWhere('user.phone IS NOT NULL')
            .getMany();

        result.processed = clients.length;

        for (const client of clients) {
            try {
                if (rule.requireSmsConsent && !client.smsConsent) {
                    result.skipped++;
                    continue;
                }

                const content = this.buildContentForClient(rule, client);
                await this.smsService.sendSms({
                    recipient: client.phone!,
                    content,
                    recipientId: client.id,
                    templateId: rule.templateId ?? undefined,
                });

                result.sent++;
            } catch (error) {
                result.errors++;
                result.details?.push(`Client ${client.id}: ${error.message}`);
            }
        }

        if (result.sent > 0) {
            rule.sentCount += result.sent;
            rule.lastSentAt = now;
            await this.ruleRepository.save(rule);
        }

        return result;
    }

    private async processInactiveClients(
        rule: AutomaticMessageRule,
    ): Promise<ProcessAutomaticMessagesResultDto> {
        const result: ProcessAutomaticMessagesResultDto = {
            trigger: rule.trigger,
            processed: 0,
            sent: 0,
            skipped: 0,
            errors: 0,
            details: [],
        };

        if (!rule.inactivityDays) {
            result.details?.push('No inactivityDays configured');
            return result;
        }

        const now = new Date();
        const inactivityThreshold = subDays(now, rule.inactivityDays);

        // Find clients who haven't had an appointment since threshold
        // but have had at least one appointment before
        const inactiveClients = await this.userRepository
            .createQueryBuilder('user')
            .where('user.role = :role', { role: Role.Client })
            .andWhere('user.phone IS NOT NULL')
            .andWhere((qb) => {
                const subQuery = qb
                    .subQuery()
                    .select('MAX(a.startTime)')
                    .from(Appointment, 'a')
                    .where('a.clientId = user.id')
                    .andWhere('a.status = :status', {
                        status: AppointmentStatus.Completed,
                    })
                    .getQuery();
                return `(${subQuery}) < :threshold AND (${subQuery}) IS NOT NULL`;
            })
            .setParameter('threshold', inactivityThreshold)
            .getMany();

        result.processed = inactiveClients.length;

        for (const client of inactiveClients) {
            try {
                if (rule.requireSmsConsent && !client.smsConsent) {
                    result.skipped++;
                    continue;
                }

                const content = this.buildContentForClient(rule, client);
                await this.smsService.sendSms({
                    recipient: client.phone!,
                    content,
                    recipientId: client.id,
                    templateId: rule.templateId ?? undefined,
                });

                result.sent++;
            } catch (error) {
                result.errors++;
                result.details?.push(`Client ${client.id}: ${error.message}`);
            }
        }

        if (result.sent > 0) {
            rule.sentCount += result.sent;
            rule.lastSentAt = now;
            await this.ruleRepository.save(rule);
        }

        return result;
    }

    private async processReviewRequests(
        rule: AutomaticMessageRule,
    ): Promise<ProcessAutomaticMessagesResultDto> {
        const result: ProcessAutomaticMessagesResultDto = {
            trigger: rule.trigger,
            processed: 0,
            sent: 0,
            skipped: 0,
            errors: 0,
            details: [],
        };

        const now = new Date();
        const targetTime = subHours(now, rule.offsetHours);
        const windowStart = subHours(targetTime, 1);
        const windowEnd = addHours(targetTime, 1);

        // Find completed appointments without reviews
        const appointments = await this.appointmentRepository
            .createQueryBuilder('appointment')
            .leftJoin('appointment.review', 'review')
            .innerJoinAndSelect('appointment.client', 'client')
            .innerJoinAndSelect('appointment.service', 'service')
            .innerJoinAndSelect('appointment.employee', 'employee')
            .where('appointment.finalizedAt BETWEEN :start AND :end', {
                start: windowStart,
                end: windowEnd,
            })
            .andWhere('appointment.status = :status', {
                status: AppointmentStatus.Completed,
            })
            .andWhere('review.id IS NULL')
            .getMany();

        result.processed = appointments.length;

        for (const appointment of appointments) {
            try {
                const client = appointment.client;
                if (!client?.phone) {
                    result.skipped++;
                    continue;
                }
                if (rule.requireSmsConsent && !client.smsConsent) {
                    result.skipped++;
                    continue;
                }

                const content = this.buildContent(rule, appointment);
                await this.smsService.sendSms({
                    recipient: client.phone,
                    content,
                    recipientId: client.id,
                    appointmentId: appointment.id,
                    templateId: rule.templateId ?? undefined,
                });

                result.sent++;
            } catch (error) {
                result.errors++;
                result.details?.push(
                    `Appointment ${appointment.id}: ${error.message}`,
                );
            }
        }

        if (result.sent > 0) {
            rule.sentCount += result.sent;
            rule.lastSentAt = now;
            await this.ruleRepository.save(rule);
        }

        return result;
    }

    // Helper: Check if current time is within send window
    private isWithinSendWindow(
        now: Date,
        startStr: string,
        endStr: string,
    ): boolean {
        const today = format(now, 'yyyy-MM-dd');
        const start = parse(
            `${today} ${startStr}`,
            'yyyy-MM-dd HH:mm:ss',
            new Date(),
        );
        const end = parse(
            `${today} ${endStr}`,
            'yyyy-MM-dd HH:mm:ss',
            new Date(),
        );

        return isWithinInterval(now, { start, end });
    }

    // Helper: Build message content from rule and appointment
    private buildContent(
        rule: AutomaticMessageRule,
        appointment: Appointment,
    ): string {
        let content = rule.template?.content ?? rule.content ?? '';

        const client = appointment.client;
        const service = appointment.service;
        const employee = appointment.employee;

        // Replace placeholders
        content = content.replace(/\{\{client_name\}\}/g, client?.name ?? '');
        content = content.replace(
            /\{\{client_first_name\}\}/g,
            client?.firstName ?? client?.name?.split(' ')[0] ?? '',
        );
        content = content.replace(/\{\{service_name\}\}/g, service?.name ?? '');
        content = content.replace(
            /\{\{employee_name\}\}/g,
            employee?.name ?? '',
        );
        content = content.replace(
            /\{\{date\}\}/g,
            format(new Date(appointment.startTime), 'dd.MM.yyyy'),
        );
        content = content.replace(
            /\{\{time\}\}/g,
            format(new Date(appointment.startTime), 'HH:mm'),
        );
        content = content.replace(
            /\{\{salon_name\}\}/g,
            process.env.SALON_NAME ?? 'Salon',
        );

        return content;
    }

    // Helper: Build message content for client-only messages (birthday, inactive)
    private buildContentForClient(
        rule: AutomaticMessageRule,
        client: User,
    ): string {
        let content = rule.template?.content ?? rule.content ?? '';

        content = content.replace(/\{\{client_name\}\}/g, client.name ?? '');
        content = content.replace(
            /\{\{client_first_name\}\}/g,
            client.firstName ?? client.name?.split(' ')[0] ?? '',
        );
        content = content.replace(
            /\{\{salon_name\}\}/g,
            process.env.SALON_NAME ?? 'Salon',
        );

        return content;
    }

    // Send immediate confirmation (called from appointments service)
    async sendAppointmentConfirmation(appointmentId: number): Promise<boolean> {
        const rule = await this.ruleRepository.findOne({
            where: {
                trigger: AutomaticMessageTrigger.AppointmentConfirmation,
                isActive: true,
            },
            relations: ['template'],
        });

        if (!rule) {
            return false;
        }

        const appointment = await this.appointmentRepository.findOne({
            where: { id: appointmentId },
            relations: ['client', 'service', 'employee'],
        });

        if (!appointment || !appointment.client?.phone) {
            return false;
        }

        if (rule.requireSmsConsent && !appointment.client.smsConsent) {
            return false;
        }

        try {
            const content = this.buildContent(rule, appointment);
            await this.smsService.sendSms({
                recipient: appointment.client.phone,
                content,
                recipientId: appointment.client.id,
                appointmentId: appointment.id,
                templateId: rule.templateId ?? undefined,
            });

            rule.sentCount++;
            rule.lastSentAt = new Date();
            await this.ruleRepository.save(rule);

            return true;
        } catch (error) {
            this.logger.error(
                `Failed to send confirmation for appointment ${appointmentId}`,
                error,
            );
            return false;
        }
    }
}
