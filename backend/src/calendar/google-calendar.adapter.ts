import axios from 'axios';

export class GoogleCalendarAdapter {
    async addEvent(token: string, event: any) {
        try {
            const res = await axios.post(
                'https://www.googleapis.com/calendar/v3/calendars/primary/events',
                event,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    proxy: false,
                },
            );
            return res.data;
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                throw new Error(`Google API error: ${err.response?.status}`);
            }
            if (err instanceof Error) {
                throw err;
            }
            throw new Error('Google API error');
        }
    }

    async updateEvent(token: string, eventId: string, event: any) {
        try {
            const res = await axios.patch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
                event,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    proxy: false,
                },
            );
            return res.data;
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                throw new Error(`Google API error: ${err.response?.status}`);
            }
            if (err instanceof Error) {
                throw err;
            }
            throw new Error('Google API error');
        }
    }

    async removeEvent(token: string, eventId: string) {
        try {
            await axios.delete(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    proxy: false,
                },
            );
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                throw new Error(`Google API error: ${err.response?.status}`);
            }
            if (err instanceof Error) {
                throw err;
            }
            throw new Error('Google API error');
        }
    }
}
