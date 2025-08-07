import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';
import { GoogleCalendarAdapter } from './google-calendar.adapter';
import { OutlookCalendarAdapter } from './outlook-calendar.adapter';
import { createEvent } from 'ics';

@Injectable()
export class CalendarService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appts: Repository<Appointment>,
        private readonly logs: LogsService,
        private readonly google: GoogleCalendarAdapter,
        private readonly outlook: OutlookCalendarAdapter,
    ) {}

    async generateEventData(id: number) {
        const appt = await this.appts.findOne({
            where: { id },
            relations: { service: true, client: true },
        });
        if (!appt) return null;
        const end =
            appt.endTime ||
            new Date(appt.startTime.getTime() + appt.service.duration * 60000);
        return {
            title: appt.service.name,
            description: `Wizyta z ${
                appt.client
                    ? `${appt.client.firstName} ${appt.client.lastName}`.trim()
                    : ''
            }`,
            startTime: appt.startTime,
            endTime: end,
        };
    }

    async add(id: number, provider: string, token?: string) {
        const data = await this.generateEventData(id);
        if (!data) return null;
        try {
            if (provider === 'google' && token) {
                const event = await this.google.addEvent(token, {
                    summary: data.title,
                    description: data.description,
                    start: { dateTime: data.startTime.toISOString() },
                    end: { dateTime: data.endTime.toISOString() },
                });
                await this.logs.create(
                    LogAction.CalendarAdd,
                    JSON.stringify({ id, provider }),
                );
                return { eventId: event.id };
            }
            if (provider === 'outlook' && token) {
                const event = await this.outlook.addEvent(token, {
                    subject: data.title,
                    body: { contentType: 'HTML', content: data.description },
                    start: { dateTime: data.startTime.toISOString(), timeZone: 'UTC' },
                    end: { dateTime: data.endTime.toISOString(), timeZone: 'UTC' },
                });
                await this.logs.create(
                    LogAction.CalendarAdd,
                    JSON.stringify({ id, provider }),
                );
                return { eventId: event.id };
            }
            const { error, value } = createEvent({
                title: data.title,
                description: data.description,
                start: [
                    data.startTime.getUTCFullYear(),
                    data.startTime.getUTCMonth() + 1,
                    data.startTime.getUTCDate(),
                    data.startTime.getUTCHours(),
                    data.startTime.getUTCMinutes(),
                ],
                end: [
                    data.endTime.getUTCFullYear(),
                    data.endTime.getUTCMonth() + 1,
                    data.endTime.getUTCDate(),
                    data.endTime.getUTCHours(),
                    data.endTime.getUTCMinutes(),
                ],
            });
            if (error) throw error;
            await this.logs.create(
                LogAction.CalendarAdd,
                JSON.stringify({ id, provider: 'ics' }),
            );
            return { ics: value };
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            await this.logs.create(
                LogAction.CalendarAdd,
                JSON.stringify({ id, provider, error: message }),
            );
            throw e;
        }
    }

    async update(id: number, provider: string, token: string, eventId: string) {
        const data = await this.generateEventData(id);
        if (!data) return null;
        try {
            if (provider === 'google') {
                await this.google.updateEvent(token, eventId, {
                    summary: data.title,
                });
            } else if (provider === 'outlook') {
                await this.outlook.updateEvent(token, eventId, {
                    subject: data.title,
                });
            }
            await this.logs.create(
                LogAction.CalendarUpdate,
                JSON.stringify({ id, provider }),
            );
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            await this.logs.create(
                LogAction.CalendarUpdate,
                JSON.stringify({ id, provider, error: message }),
            );
            throw e;
        }
    }

    async remove(provider: string, token: string, eventId: string) {
        try {
            if (provider === 'google') {
                await this.google.removeEvent(token, eventId);
            } else if (provider === 'outlook') {
                await this.outlook.removeEvent(token, eventId);
            }
            await this.logs.create(
                LogAction.CalendarDelete,
                JSON.stringify({ provider, eventId }),
            );
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            await this.logs.create(
                LogAction.CalendarDelete,
                JSON.stringify({ provider, eventId, error: message }),
            );
            throw e;
        }
    }
}
