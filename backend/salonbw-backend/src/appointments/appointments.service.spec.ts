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
    let createSaleMock: AppointmentsTestContext['createSaleMock'];

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
            createSaleMock,
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

    it('should set online_pending when reservedOnline is true', async () => {
        const start = new Date(Date.now() + 2 * 60 * 60 * 1000);
        const result = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
                reservedOnline: true,
            },
            users[0],
        );

        expect(result.status).toBe(AppointmentStatus.OnlinePending);
    });

    it('extends online appointments with selected add-on services', async () => {
        services.push({
            ...services[0],
            id: 2,
            name: 'Pielęgnacja',
            duration: 30,
            price: 80,
        });
        const start = new Date(Date.now() + 2 * 60 * 60 * 1000);

        const result = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
                reservedOnline: true,
                addonServiceIds: [2],
            },
            users[0],
        );

        expect(result.endTime.getTime()).toBe(start.getTime() + 60 * 60 * 1000);
        expect(result.extraServices).toEqual([
            {
                serviceId: 2,
                name: 'Pielęgnacja',
                priceCents: 8000,
                discountCents: 0,
            },
        ]);
        expect(result.notes).toContain('Łączny czas wizyty: 60 min');
        expect(result.notes).toContain('do weryfikacji przy potwierdzeniu');
    });

    it('sends an email alert to the salon on client self-booking', async () => {
        const start = new Date(Date.now() + 2 * 60 * 60 * 1000);
        await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
                reservedOnline: true,
            },
            users[0],
        );

        expect(ctx.mockEmailsService.send).toHaveBeenCalledTimes(1);
        const dto = ctx.mockEmailsService.send.mock.calls[0][0] as {
            to: string;
            subject: string;
            data: Record<string, string>;
        };
        expect(dto.to).toBe('kontakt@salon-bw.pl');
        expect(dto.subject).toContain('Nowa rezerwacja online');
        expect(dto.data.panelUrl).toContain('panel.salon-bw.pl');
    });

    it('does not email the salon when staff books for a client', async () => {
        const start = new Date(Date.now() + 2 * 60 * 60 * 1000);
        await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[1],
        );

        expect(ctx.mockEmailsService.send).not.toHaveBeenCalled();
    });

    it('should keep scheduled status when reservedOnline is false', async () => {
        const start = new Date(Date.now() + 3 * 60 * 60 * 1000);
        const result = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
                reservedOnline: false,
            },
            users[1],
        );

        expect(result.status).toBe(AppointmentStatus.Scheduled);
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

    it('allows staff to overlap when the calendar setting is enabled', async () => {
        ctx.mockCalendarSettingsRepo.find.mockResolvedValue([
            { allowOverlappingAppointments: true },
        ]);
        const start = new Date(Date.now() + 60 * 60 * 1000);
        // Staff actor (employee) booking for a client -> not self-booking.
        await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[1],
        );
        const overlap = new Date(start.getTime() + 15 * 60 * 1000);
        const second = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: overlap,
            },
            users[1],
        );
        expect(second.id).toBeDefined();
    });

    it('still blocks online self-booking overlap even when overlap is enabled', async () => {
        ctx.mockCalendarSettingsRepo.find.mockResolvedValue([
            { allowOverlappingAppointments: true },
        ]);
        const start = new Date(Date.now() + 60 * 60 * 1000);
        await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[1],
        );
        const overlap = new Date(start.getTime() + 15 * 60 * 1000);
        // Client self-booking (actor === client) must still respect availability.
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

    it('should update appointment status from scheduled to confirmed', async () => {
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

        const updated = await service.updateStatus(
            id,
            AppointmentStatus.Confirmed,
            users[1],
        );

        expect(updated?.status).toBe(AppointmentStatus.Confirmed);
    });

    it('should reject invalid status transition to confirmed from completed', async () => {
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

        await expect(
            service.updateStatus(id, AppointmentStatus.Confirmed, users[1]),
        ).rejects.toBeInstanceOf(BadRequestException);
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

    it('should record cancellation request for future appointment without status change', async () => {
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

        const result = await service.requestCancellation(
            id,
            users[0],
            'Nie mogę przyjść',
        );

        expect(result?.status).toBe(AppointmentStatus.OnlinePending);
        expect(logActionSpy).toHaveBeenCalledWith(
            users[0],
            LogAction.APPOINTMENT_CANCELLATION_REQUESTED,
            expect.objectContaining({
                appointmentId: id,
                action: 'cancellation_request',
                reason: 'Nie mogę przyjść',
            }),
        );
    });

    it('should reject cancellation request for past appointment', async () => {
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

        const now = new Date();
        now.setHours(now.getHours() - 2);
        const target = appointments.find(
            (appointment) => appointment.id === id,
        );
        if (!target) {
            throw new Error('Appointment not found in test context');
        }
        target.startTime = now;
        target.endTime = now;

        await expect(
            service.requestCancellation(id, users[0], 'za późno'),
        ).rejects.toBeInstanceOf(BadRequestException);
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
        expect(appt?.status).toBe(AppointmentStatus.OnlinePending);
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

    it('finalizes appointment without products', async () => {
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

        const finalized = await service.finalizeAppointment(
            id,
            {
                paymentMethod: 'cash' as never,
                paidAmountCents: 10000,
                tipAmountCents: 1500,
                discountCents: 500,
                note: 'test finalize',
            },
            users[1],
        );

        expect(finalized?.status).toBe(AppointmentStatus.Completed);
        expect(createFromAppointmentMock).toHaveBeenCalledTimes(1);
        expect(createSaleMock).not.toHaveBeenCalled();
    });

    it('finalizes appointment with products and creates retail sales', async () => {
        users[0].name = 'Jan Kowalski';
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

        const finalized = await service.finalizeAppointment(
            id,
            {
                paymentMethod: 'card' as never,
                paidAmountCents: 15000,
                products: [
                    {
                        productId: 101,
                        quantity: 2,
                        unitPriceCents: 2500,
                    },
                    {
                        productId: 202,
                        quantity: 1,
                        unitPriceCents: 5000,
                        discountCents: 500,
                    },
                ],
            },
            users[1],
        );

        expect(finalized?.status).toBe(AppointmentStatus.Completed);
        expect(createFromAppointmentMock).toHaveBeenCalledTimes(1);
        expect(createSaleMock).toHaveBeenCalledTimes(2);
        expect(createSaleMock).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                productId: 101,
                quantity: 2,
                unitPriceCents: 2500,
                employeeId: users[1].id,
                appointmentId: id,
                clientId: users[0].id,
                clientName: 'Jan Kowalski',
            }),
            users[1],
        );
        expect(createSaleMock).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                productId: 202,
                quantity: 1,
                unitPriceCents: 5000,
                discountCents: 500,
                employeeId: users[1].id,
                appointmentId: id,
                clientId: users[0].id,
                clientName: 'Jan Kowalski',
            }),
            users[1],
        );
    });
});
