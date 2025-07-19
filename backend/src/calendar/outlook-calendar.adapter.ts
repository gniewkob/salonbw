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
        } catch (err: any) {
            throw new Error(`Outlook API error: ${err.response?.status}`);
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
        } catch (err: any) {
            throw new Error(`Outlook API error: ${err.response?.status}`);
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
        } catch (err: any) {
            throw new Error(`Outlook API error: ${err.response?.status}`);
        }
    }
}
