import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { PinoLogger } from 'nestjs-pino';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SendEmailDto } from './dto/send-email.dto';
import { MetricsService } from '../observability/metrics.service';
import { EmailLog, EmailLogStatus } from './email-log.entity';
import { User } from '../users/user.entity';

type MailOptions = { to: string; subject: string; html: string; from?: string };
type TransportOpts = {
    host: string;
    port: number;
    secure: boolean;
    auth?: { user: string; pass: string };
};
type MailTransporter = {
    sendMail: (opts: MailOptions) => Promise<unknown>;
    verify?: () => Promise<unknown>;
};

@Injectable()
export class EmailsService {
    private readonly transporter: MailTransporter | null;
    private readonly fromAddress: string | null;

    private readonly isProduction: boolean;
    private readonly smtpStatus: { configured: boolean; error?: string };

    constructor(
        private readonly configService: ConfigService,
        private readonly metrics: MetricsService,
        private readonly logger: PinoLogger,
        @InjectRepository(EmailLog)
        private readonly emailLogs: Repository<EmailLog>,
        @InjectRepository(User)
        private readonly users: Repository<User>,
    ) {
        this.logger.setContext('EmailsService');
        this.isProduction =
            this.configService.get<string>('NODE_ENV') === 'production';

        const host = this.configService.get<string>('SMTP_HOST');
        const port = this.configService.get<string>('SMTP_PORT');
        const user = this.configService.get<string>('SMTP_USER');
        const pass = this.configService.get<string>('SMTP_PASSWORD');
        const secure =
            this.configService.get<string>('SMTP_SECURE', 'false') === 'true';

        if (host && port) {
            const opts: TransportOpts = {
                host,
                port: Number(port),
                secure,
                auth: user && pass ? { user, pass } : undefined,
            };
            const factory = createTransport as unknown as (
                o: TransportOpts,
            ) => unknown;
            this.transporter = factory(opts) as MailTransporter;
            this.smtpStatus = { configured: true };
            this.logger.info({ host, port, secure }, 'SMTP configured');
        } else {
            this.transporter = null;
            this.smtpStatus = {
                configured: false,
                error: 'SMTP_HOST and SMTP_PORT are required',
            };

            if (this.isProduction) {
                const msg = 'SMTP configuration is required in production';
                this.logger.error(this.smtpStatus, msg);
                throw new Error(msg);
            } else {
                this.logger.warn(
                    this.smtpStatus,
                    'SMTP not configured, emails will be logged',
                );
            }
        }

        this.fromAddress =
            this.configService.get<string>('SMTP_FROM') ??
            this.configService.get<string>('SMTP_USER') ??
            null;
    }

    async verifyConnection(): Promise<void> {
        if (!this.transporter) {
            throw new Error(this.smtpStatus.error ?? 'SMTP not configured');
        }
        if (typeof this.transporter.verify === 'function') {
            await this.transporter.verify();
        }
    }

    async send(dto: SendEmailDto): Promise<void> {
        return this.sendInternal(dto, { sentById: null });
    }

    async sendAsUser(dto: SendEmailDto, sentById: number): Promise<void> {
        return this.sendInternal(dto, { sentById });
    }

    private async sendInternal(
        dto: SendEmailDto,
        opts: { sentById: number | null },
    ): Promise<void> {
        const html = this.renderTemplate(dto.template, dto.data);

        const resolvedRecipientId =
            dto.recipientId ??
            (dto.to
                ? ((await this.users.findOne({ where: { email: dto.to } }))
                      ?.id ?? null)
                : null);

        const log = this.emailLogs.create({
            to: dto.to,
            subject: dto.subject,
            template: dto.template,
            data: dto.data ?? null,
            status: EmailLogStatus.Pending,
            errorMessage: null,
            recipientId: resolvedRecipientId,
            sentById: opts.sentById,
            sentAt: null,
        });

        const savedLog = await this.emailLogs.save(log);

        if (!this.transporter) {
            if (this.isProduction) {
                this.metrics.incEmail('failed');
                await this.emailLogs.update(savedLog.id, {
                    status: EmailLogStatus.Failed,
                    errorMessage:
                        this.smtpStatus.error ?? 'SMTP not configured',
                });
                throw new InternalServerErrorException(
                    'Email service is not configured',
                    { cause: this.smtpStatus.error },
                );
            }

            // In development, just log the email
            this.logger.warn(
                {
                    to: dto.to,
                    subject: dto.subject,
                    template: dto.template,
                    data: dto.data,
                },
                'Email logged (SMTP not configured)',
            );
            this.metrics.incEmail('success');
            await this.emailLogs.update(savedLog.id, {
                status: EmailLogStatus.Sent,
                sentAt: new Date(),
            });
            return;
        }

        try {
            const mailOptions: MailOptions = {
                to: dto.to,
                subject: dto.subject,
                html,
                from: this.fromAddress ?? dto.to,
            };

            await this.transporter.sendMail(mailOptions);
            this.logger.info(
                { to: dto.to, subject: dto.subject },
                'Email sent successfully',
            );
            this.metrics.incEmail('success');
            await this.emailLogs.update(savedLog.id, {
                status: EmailLogStatus.Sent,
                sentAt: new Date(),
            });
        } catch (error: unknown) {
            this.logger.error(
                { error, to: dto.to, subject: dto.subject },
                'Failed to send email',
            );
            this.metrics.incEmail('failed');
            await this.emailLogs.update(savedLog.id, {
                status: EmailLogStatus.Failed,
                errorMessage:
                    error instanceof Error ? error.message : String(error),
            });
            throw new InternalServerErrorException(
                'Failed to send email message',
                { cause: error },
            );
        }
    }

    private renderTemplate(
        template: string,
        data?: Record<string, string>,
    ): string {
        const context = data ?? {};
        return template.replace(
            /\{\{\s*(\w+)\s*\}\}/g,
            (_match, key: string) => context[key] ?? '',
        );
    }
}
