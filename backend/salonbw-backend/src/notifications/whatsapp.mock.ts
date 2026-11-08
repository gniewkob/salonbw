/**
 * Deterministic transport mock: simulate provider acceptance without any
 * outbound delivery. Tests that need rejection can override the method.
 */
export class WhatsappServiceMock {
    async sendTemplate(): Promise<boolean> {
        return true;
    }

    async sendBookingConfirmation(): Promise<boolean> {
        return true;
    }

    async sendReminder(): Promise<boolean> {
        return true;
    }

    async sendFollowUp(): Promise<boolean> {
        return true;
    }

    async sendNewBookingToEmployee(): Promise<boolean> {
        return true;
    }

    async sendRescheduleNotification(): Promise<boolean> {
        return true;
    }
}
