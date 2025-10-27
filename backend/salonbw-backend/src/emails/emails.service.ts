import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
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

    constructor(
        private readonly configService: ConfigService,
        private readonly metrics: MetricsService,
    ) {
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
        } else {
            this.transporter = null;
        }

        this.fromAddress =
            this.configService.get<string>('SMTP_FROM') ??
            this.configService.get<string>('SMTP_USER') ??
            null;
    }

    async send(dto: SendEmailDto): Promise<void> {
        const html = this.renderTemplate(dto.template, dto.data);

        if (!this.transporter) {
            // When SMTP is not configured we simply log the email payload.
            // This keeps the endpoint functional for environments where mail
            // infrastructure is not yet available.

            console.warn(
                '[EmailsService] SMTP is not configured. Email payload:',
                { ...dto, html },
            );
            this.metrics.incEmail('success');
            return;
        }

        try {
            await this.transporter.sendMail({
                to: dto.to,
                subject: dto.subject,
                html,
                from: this.fromAddress ?? dto.to,
            } as MailOptions);
            this.metrics.incEmail('success');
        } catch (error: unknown) {
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
