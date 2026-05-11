import {
    configureReceptionTelemetryTransport,
    trackReceptionAction,
} from '@/components/calendar/receptionTelemetry';

const trackEventMock = jest.fn();

jest.mock('@/utils/analytics', () => ({
    trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

describe('receptionTelemetry', () => {
    beforeEach(() => {
        trackEventMock.mockReset();
        configureReceptionTelemetryTransport(null);
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-05-11T12:00:00.000Z'));
    });

    afterEach(() => {
        configureReceptionTelemetryTransport(null);
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('tracks analytics and sends backend payload with eventName + occurredAt', async () => {
        const senderMock = jest.fn().mockResolvedValue(undefined);

        configureReceptionTelemetryTransport(senderMock);

        trackReceptionAction({
            action: 'start_appointment',
            appointmentId: 42,
            customerId: 7,
            customerAlertSeverity: 'warning',
            source: 'reception_view',
        });

        expect(trackEventMock).toHaveBeenCalledWith(
            'reception_operational_action',
            {
                action: 'start_appointment',
                appointmentId: 42,
                customerId: 7,
                customerAlertSeverity: 'warning',
                source: 'reception_view',
            },
        );

        await Promise.resolve();

        expect(senderMock).toHaveBeenCalledWith({
            eventName: 'reception_operational_action',
            action: 'start_appointment',
            appointmentId: 42,
            customerId: 7,
            customerAlertSeverity: 'warning',
            source: 'reception_view',
            occurredAt: '2026-05-11T12:00:00.000Z',
        });
    });

    it('does not send empty customerId/customerAlertSeverity', async () => {
        const senderMock = jest.fn().mockResolvedValue(undefined);
        configureReceptionTelemetryTransport(senderMock);

        trackReceptionAction({
            action: 'open_sale_detail',
            appointmentId: 88,
            customerId: null,
            source: 'calendar',
        });

        await Promise.resolve();

        expect(senderMock).toHaveBeenCalledWith(
            expect.objectContaining({
                eventName: 'reception_operational_action',
                action: 'open_sale_detail',
                appointmentId: 88,
                source: 'calendar',
            }),
        );

        expect(senderMock.mock.calls[0][0]).not.toHaveProperty('customerId');
        expect(senderMock.mock.calls[0][0]).not.toHaveProperty(
            'customerAlertSeverity',
        );
    });

    it('keeps analytics working when backend transport fails', async () => {
        const senderMock = jest.fn().mockRejectedValue(new Error('network'));
        configureReceptionTelemetryTransport(senderMock);

        expect(() =>
            trackReceptionAction({
                action: 'confirm_appointment',
                appointmentId: 12,
                source: 'appointment_drawer',
            }),
        ).not.toThrow();

        expect(trackEventMock).toHaveBeenCalledWith(
            'reception_operational_action',
            {
                action: 'confirm_appointment',
                appointmentId: 12,
                source: 'appointment_drawer',
            },
        );

        await Promise.resolve();
        expect(senderMock).toHaveBeenCalledTimes(1);
    });
});
