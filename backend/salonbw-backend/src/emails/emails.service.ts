import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { PinoLogger } from 'nestjs-pino';
import { SendEmailDto } from './dto/send-email.dto';
import { MetricsService } from '../observability/metrics.service';

type MailOptions = { to: string; subject: string; html: string; from?: string };
type TransportOpts = {
    host: string;
    port: number;
    secure: boolean;
    auth?: { user: string; pass: string };
};
type MailTransporter = { sendMail: (opts: MailOptions) => Promise<unknown> };

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

    async send(dto: SendEmailDto): Promise<void> {
        const html = this.renderTemplate(dto.template, dto.data);

        if (!this.transporter) {
            if (this.isProduction) {
                this.metrics.incEmail('failed');
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
        } catch (error: unknown) {
            this.logger.error(
                { error, to: dto.to, subject: dto.subject },
                'Failed to send email',
            );
            this.metrics.incEmail('failed');
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
