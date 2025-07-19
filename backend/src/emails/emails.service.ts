import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailLog, EmailStatus } from './email-log.entity';
import { EmailOptOut } from './email-optout.entity';
import * as sgMail from '@sendgrid/mail';
import * as Mustache from 'mustache';
import { randomBytes } from 'crypto';

export interface EmailPayload {
    to: string;
    subject: string;
    template: string;
    data: Record<string, any>;
}

@Injectable()
export class EmailsService {
    private readonly logger = new Logger(EmailsService.name);

    constructor(
        @InjectRepository(EmailLog)
        private readonly logs: Repository<EmailLog>,
        @InjectRepository(EmailOptOut)
        private readonly optouts: Repository<EmailOptOut>,
    ) {
        if (process.env.SENDGRID_API_KEY) {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        }
    }

    private async render(template: string, data: any) {
        return Mustache.render(template, data);
    }

    async sendEmail(payload: EmailPayload) {
        const isOpted = await this.optouts.findOne({
            where: { email: payload.to },
        });
        if (isOpted) {
            const log = this.logs.create({
                recipient: payload.to,
                subject: payload.subject,
                html: '',
                status: EmailStatus.Skipped,
                error: 'opt-out',
                token: '',
            });
            return this.logs.save(log);
        }
        const token = randomBytes(16).toString('hex');
        const html = await this.render(payload.template, {
            ...payload.data,
            unsubscribeUrl: `${process.env.FRONTEND_URL}/emails/unsubscribe/${token}`,
        });
        const log = this.logs.create({
            recipient: payload.to,
            subject: payload.subject,
            html,
            status: EmailStatus.Pending,
            error: null,
            token,
        });
        await this.logs.save(log);
        try {
            if (process.env.EMAILS_ENABLED === 'false') {
                log.status = EmailStatus.Sent;
            } else {
                await sgMail.send({
                    to: payload.to,
                    from: 'noreply@example.com',
                    subject: payload.subject,
                    html,
                });
                log.status = EmailStatus.Sent;
            }
        } catch (err: any) {
            log.status = EmailStatus.Failed;
            log.error = err.message;
            this.logger.error(`Email send failed: ${err.message}`);
        }
        return this.logs.save(log);
    }

    async sendBulk(payloads: EmailPayload[]) {
        const results: EmailLog[] = [];
        for (const p of payloads) {
            // eslint-disable-next-line no-await-in-loop
            results.push(await this.sendEmail(p));
        }
        return results;
    }

    async findAll() {
        return this.logs.find({ order: { sentAt: 'DESC' } });
    }

    async optOut(tokenOrEmail: string) {
        const log = await this.logs.findOne({ where: { token: tokenOrEmail } });
        const email = log ? log.recipient : tokenOrEmail;
        const existing = await this.optouts.findOne({ where: { email } });
        if (!existing) {
            await this.optouts.save(this.optouts.create({ email }));
        }
        return { message: 'unsubscribed' };
    }
}
