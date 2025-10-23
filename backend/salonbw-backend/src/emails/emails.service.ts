import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import { SendEmailDto } from './dto/send-email.dto';

@Injectable()
export class EmailsService {
    private readonly transporter: Transporter | null;
    private readonly fromAddress: string | null;

    constructor(private readonly configService: ConfigService) {
        const host = this.configService.get<string>('SMTP_HOST');
        const port = this.configService.get<string>('SMTP_PORT');
        const user = this.configService.get<string>('SMTP_USER');
        const pass = this.configService.get<string>('SMTP_PASSWORD');
        const secure =
            this.configService.get<string>('SMTP_SECURE', 'false') === 'true';

        if (host && port) {
            this.transporter = nodemailer.createTransport({
                host,
                port: Number(port),
                secure,
                auth:
                    user && pass
                        ? {
                              user,
                              pass,
                          }
                        : undefined,
            });
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
            // eslint-disable-next-line no-console
            console.warn(
                '[EmailsService] SMTP is not configured. Email payload:',
                { ...dto, html },
            );
            return;
        }

        try {
            await this.transporter.sendMail({
                to: dto.to,
                subject: dto.subject,
                html,
                from: this.fromAddress ?? dto.to,
            });
        } catch (error: unknown) {
            throw new InternalServerErrorException(
                'Failed to send email message',
                { cause: error },
            );
        }
    }

    private renderTemplate(
        template: string,
        data: Record<string, string>,
    ): string {
        return template.replace(
            /\{\{\s*(\w+)\s*\}\}/g,
            (_match, key: string) => data[key] ?? '',
        );
    }
}

