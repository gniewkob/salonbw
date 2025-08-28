export class WhatsappServiceMock {
    // Mock methods mirror WhatsappService interface
    async sendTemplate(): Promise<void> {
        // no-op in tests
    }
    async sendBookingConfirmation(): Promise<void> {
        // no-op in tests
    }
    async sendReminder(): Promise<void> {
        // no-op in tests
    }
    async sendFollowUp(): Promise<void> {
        // no-op in tests
    }
}

