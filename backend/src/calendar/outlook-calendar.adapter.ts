import axios from 'axios';

export class OutlookCalendarAdapter {
    async addEvent(token: string, event: any) {
        try {
            const res = await axios.post(
                'https://graph.microsoft.com/v1.0/me/events',
                event,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    proxy: false,
                },
            );
            return res.data;
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                throw new Error(`Outlook API error: ${err.response?.status}`);
            }
            if (err instanceof Error) {
                throw err;
            }
            throw new Error('Outlook API error');
        }
    }

    async updateEvent(token: string, eventId: string, event: any) {
        try {
            const res = await axios.patch(
                `https://graph.microsoft.com/v1.0/me/events/${eventId}`,
                event,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    proxy: false,
                },
            );
            return res.data;
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                throw new Error(`Outlook API error: ${err.response?.status}`);
            }
            if (err instanceof Error) {
                throw err;
            }
            throw new Error('Outlook API error');
        }
    }

    async removeEvent(token: string, eventId: string) {
        try {
            await axios.delete(
                `https://graph.microsoft.com/v1.0/me/events/${eventId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    proxy: false,
                },
            );
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                throw new Error(`Outlook API error: ${err.response?.status}`);
            }
            if (err instanceof Error) {
                throw err;
            }
            throw new Error('Outlook API error');
        }
    }
}
