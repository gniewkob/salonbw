import {
    AppointmentStatus,
    BadRequestException,
    ConflictException,
    LogAction,
    createAppointmentsTestContext,
} from './test-context';
import type { AppointmentsTestContext } from './test-context';

describe('AppointmentsService', () => {
    let ctx: AppointmentsTestContext;
    let service: AppointmentsTestContext['service'];
    let appointments: AppointmentsTestContext['appointments'];
    let users: AppointmentsTestContext['users'];
    let services: AppointmentsTestContext['services'];
    let mockAppointmentsRepo: AppointmentsTestContext['mockAppointmentsRepo'];
    let mockWhatsappService: AppointmentsTestContext['mockWhatsappService'];
    let logActionSpy: AppointmentsTestContext['logActionSpy'];
    let sendFollowUpMock: AppointmentsTestContext['sendFollowUpMock'];
    let transactionMock: AppointmentsTestContext['transactionMock'];
    let createFromAppointmentMock: AppointmentsTestContext['createFromAppointmentMock'];

    beforeEach(() => {
        ctx = createAppointmentsTestContext();
        ({
            service,
            appointments,
            users,
            services,
            mockAppointmentsRepo,
            mockWhatsappService,
            logActionSpy,
            sendFollowUpMock,
            transactionMock,
            createFromAppointmentMock,
        } = ctx);
    });

    it('should create an appointment', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const result = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        const sendBookingConfirmationMock =
            mockWhatsappService.sendBookingConfirmation.bind(
                mockWhatsappService,
            ) as jest.Mock;

        Object.assign(
            sendBookingConfirmationMock,
            // eslint-disable-next-line @typescript-eslint/unbound-method
            mockWhatsappService.sendBookingConfirmation,
        );

        expect(result.id).toBeDefined();
        expect(result.endTime.getTime()).toBe(start.getTime() + 30 * 60 * 1000);
        expect(appointments).toHaveLength(1);
        expect(logActionSpy).toHaveBeenCalledWith(
            users[0],
            LogAction.APPOINTMENT_CREATED,
            expect.objectContaining({ id: result.id }),
        );

        const date = start.toISOString().split('T')[0];
        const time = start.toISOString().split('T')[1].slice(0, 5);
        expect(sendBookingConfirmationMock).toHaveBeenCalledWith(
            users[0].phone,
            date,
            time,
        );
        expect(
            mockAppointmentsRepo.save.mock.invocationCallOrder[0],
        ).toBeLessThan(sendBookingConfirmationMock.mock.invocationCallOrder[0]);
    });

    it('should not send booking confirmation if client has no phone', async () => {
        users[0].phone = null;
        const start = new Date(Date.now() + 60 * 60 * 1000);
        await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        const sendBookingConfirmationMock =
            mockWhatsappService.sendBookingConfirmation.bind(
                mockWhatsappService,
            ) as jest.Mock;

        Object.assign(
            sendBookingConfirmationMock,
            // eslint-disable-next-line @typescript-eslint/unbound-method
            mockWhatsappService.sendBookingConfirmation,
        );
        expect(sendBookingConfirmationMock).not.toHaveBeenCalled();
    });

    it('should not send booking confirmation if client disabled notifications', async () => {
        users[0].receiveNotifications = false;
        const start = new Date(Date.now() + 60 * 60 * 1000);
        await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        const sendBookingConfirmationMock =
            mockWhatsappService.sendBookingConfirmation.bind(
                mockWhatsappService,
            ) as jest.Mock;

        Object.assign(
            sendBookingConfirmationMock,
            // eslint-disable-next-line @typescript-eslint/unbound-method
            mockWhatsappService.sendBookingConfirmation,
        );
        expect(sendBookingConfirmationMock).not.toHaveBeenCalled();
    });

    it('should create an appointment even if logging fails', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        logActionSpy.mockRejectedValueOnce(new Error('fail'));
        const result = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        expect(result.id).toBeDefined();
        expect(appointments).toHaveLength(1);
    });

    it('should reject overlapping appointments', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        const overlap = new Date(start.getTime() + 15 * 60 * 1000);
        await expect(
            service.create(
                {
                    client: users[0],
                    employee: users[1],
                    service: services[0],
                    startTime: overlap,
                },
                users[0],
            ),
        ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should cancel a scheduled appointment', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        const cancelled = await service.cancel(id, users[0]);
        expect(cancelled?.status).toBe(AppointmentStatus.Cancelled);
        expect(mockAppointmentsRepo.update.mock.calls[0]).toEqual([
            id,
            { status: AppointmentStatus.Cancelled },
        ]);
        expect(logActionSpy).toHaveBeenNthCalledWith(
            2,
            users[0],
            LogAction.APPOINTMENT_CANCELLED,
            expect.objectContaining({
                appointmentId: id,
                status: AppointmentStatus.Cancelled,
            }),
        );
    });

    it('should cancel an appointment even if logging fails', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        logActionSpy.mockRejectedValueOnce(new Error('fail'));
        const cancelled = await service.cancel(id, users[0]);
        expect(cancelled?.status).toBe(AppointmentStatus.Cancelled);
    });

    it('should not cancel a completed appointment', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        await service.completeAppointment(id, users[1]);
        await expect(service.cancel(id, users[0])).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('should not cancel an already cancelled appointment', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        await service.cancel(id, users[0]);
        await expect(service.cancel(id, users[0])).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('should not complete a cancelled appointment', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        await service.cancel(id, users[0]);
        await expect(
            service.completeAppointment(id, users[1]),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should revert completion if commission creation fails', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        createFromAppointmentMock.mockRejectedValueOnce(new Error('fail'));

        await expect(service.completeAppointment(id, users[1])).rejects.toThrow(
            'fail',
        );
        const appt = await service.findOne(id);
        expect(appt?.status).toBe(AppointmentStatus.Scheduled);
    });

    it('should complete an appointment even if logging fails', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        logActionSpy.mockRejectedValueOnce(new Error('fail'));
        const completed = await service.completeAppointment(id, users[1]);
        expect(completed?.status).toBe(AppointmentStatus.Completed);
    });

    it('should log when completing an appointment', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        await service.completeAppointment(id, users[1]);
        expect(logActionSpy).toHaveBeenNthCalledWith(
            2,
            users[1],
            LogAction.APPOINTMENT_COMPLETED,
            expect.objectContaining({
                appointmentId: id,
                status: AppointmentStatus.Completed,
            }),
        );
        const date = start.toISOString().split('T')[0];
        const time = start.toISOString().split('T')[1].slice(0, 5);
        expect(sendFollowUpMock).toHaveBeenCalledWith(
            users[0].phone,
            date,
            time,
        );
        expect(transactionMock.mock.invocationCallOrder[0]).toBeLessThan(
            sendFollowUpMock.mock.invocationCallOrder[0],
        );
    });

    it('should not send follow up if client has no phone', async () => {
        users[0].phone = null;
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        await service.completeAppointment(id, users[1]);
        expect(sendFollowUpMock).not.toHaveBeenCalled();
    });

    it('should not send follow up if client disabled notifications', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        users[0].receiveNotifications = false;
        await service.completeAppointment(id, users[1]);
        expect(sendFollowUpMock).not.toHaveBeenCalled();
    });

    it('should not create duplicate commissions when completing twice', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        await service.completeAppointment(id, users[1]);
        const calls = createFromAppointmentMock.mock.calls.length;
        await expect(
            service.completeAppointment(id, users[1]),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(createFromAppointmentMock.mock.calls.length).toBe(calls);
    });
});
