/**
 * Deterministic transport mock: simulate provider acceptance without any
 * outbound delivery. Tests that need rejection can override the method.
 */
export class WhatsappServiceMock {
    sendTemplate(): Promise<boolean> {
        return Promise.resolve(true);
    }

    sendBookingConfirmation(): Promise<boolean> {
        return Promise.resolve(true);
    }

    sendReminder(): Promise<boolean> {
        return Promise.resolve(true);
    }

    sendFollowUp(): Promise<boolean> {
        return Promise.resolve(true);
    }

    sendNewBookingToEmployee(): Promise<boolean> {
        return Promise.resolve(true);
    }

    sendRescheduleNotification(): Promise<boolean> {
        return Promise.resolve(true);
    }
}
