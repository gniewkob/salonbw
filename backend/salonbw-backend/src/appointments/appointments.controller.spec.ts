import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Appointment } from './appointment.entity';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Role } from '../users/role.enum';

describe('AppointmentsController staff read scope', () => {
    const findOne = jest.fn();
    const findAllInRange = jest.fn();
    const findForUser = jest.fn();
    const create = jest.fn();
    const requestCancellation = jest.fn();
    const controller = new AppointmentsController({
        findOne,
        findAllInRange,
        findForUser,
        create,
        requestCancellation,
    } as unknown as AppointmentsService);

    beforeEach(() => {
        findOne.mockReset();
        findAllInRange.mockReset();
        findForUser.mockReset();
        create.mockReset();
        requestCancellation.mockReset();
    });

    it('rejects the client role from the staff appointment list', async () => {
        findForUser.mockResolvedValue([
            {
                id: 42,
                internalNote: 'Notatka tylko dla personelu',
                paidAmount: 280,
            },
        ]);

        await expect(
            controller.findAll({}, { userId: 5, role: Role.Client }),
        ).rejects.toBeInstanceOf(ForbiddenException);
        expect(findForUser).not.toHaveBeenCalled();
    });

    it('sanitizes every appointment in the employee calendar list', async () => {
        findAllInRange.mockResolvedValue([
            {
                id: 42,
                clientId: 5,
                employeeId: 7,
                serviceId: 10,
                serviceVariantId: 11,
                startTime: new Date('2026-09-10T09:00:00.000Z'),
                endTime: new Date('2026-09-10T11:00:00.000Z'),
                status: 'confirmed',
                onlineDurationNeedsVerification: false,
                reminderAttemptCount: 3,
                client: {
                    id: 5,
                    name: 'Klientka Testowa',
                    phone: '+48000000000',
                    email: 'client@example.test',
                    address: 'Pole zbędne w kalendarzu',
                },
                employee: {
                    id: 7,
                    name: 'Pracownik Testowy',
                    email: 'staff@example.test',
                    commissionBase: 40,
                },
                service: {
                    id: 10,
                    name: 'Koloryzacja',
                    duration: 120,
                    price: 280,
                    priceType: 'fixed',
                    isActive: true,
                    onlineBooking: true,
                    sortOrder: 1,
                    privateDescription: 'Instrukcja wewnętrzna',
                    commissionPercent: 35,
                },
                serviceVariant: {
                    id: 11,
                    serviceId: 10,
                    name: 'Długie włosy',
                    description: 'Wariant widoczny w terminarzu',
                    duration: 120,
                    price: 280,
                    priceType: 'fixed',
                    sortOrder: 1,
                    isActive: true,
                    createdAt: new Date('2026-09-01T08:00:00.000Z'),
                },
            } as Appointment,
        ]);

        const result = await controller.findAll(
            {},
            { userId: 7, role: Role.Employee },
        );

        expect(result).toEqual([
            expect.objectContaining({
                id: 42,
                client: {
                    id: 5,
                    name: 'Klientka Testowa',
                    phone: '+48000000000',
                    email: 'client@example.test',
                },
                employee: { id: 7, name: 'Pracownik Testowy' },
                serviceVariant: {
                    id: 11,
                    serviceId: 10,
                    name: 'Długie włosy',
                    description: 'Wariant widoczny w terminarzu',
                    duration: 120,
                    price: 280,
                    priceType: 'fixed',
                    sortOrder: 1,
                    isActive: true,
                },
            }),
        ]);
        expect(JSON.stringify(result)).not.toContain('staff@example.test');
        expect(JSON.stringify(result)).not.toContain('commissionBase');
        expect(JSON.stringify(result)).not.toContain('privateDescription');
        expect(JSON.stringify(result)).not.toContain('reminderAttemptCount');
    });

    it('does not return staff-only fields after a client cancellation request', async () => {
        requestCancellation.mockResolvedValue({
            id: 42,
            clientId: 5,
            employeeId: 7,
            serviceId: 10,
            startTime: new Date('2026-09-10T09:00:00.000Z'),
            endTime: new Date('2026-09-10T11:00:00.000Z'),
            status: 'confirmed',
            internalNote: 'Receptura tylko dla personelu',
            paidAmount: 280,
            tipAmount: 20,
            reminderAttemptCount: 3,
        } as Appointment);

        const result = await controller.requestCancellation(
            42,
            { reason: 'Zmiana planów' },
            { userId: 5, role: Role.Client },
        );

        expect(result).toEqual({
            id: 42,
            clientId: 5,
            employeeId: 7,
            serviceId: 10,
            serviceVariantId: undefined,
            startTime: new Date('2026-09-10T09:00:00.000Z'),
            endTime: new Date('2026-09-10T11:00:00.000Z'),
            status: 'confirmed',
            clientComment: null,
            staffRecommendations: null,
            onlineAddonsSummary: null,
            onlineTotalDurationMinutes: null,
            onlineDurationNeedsVerification: false,
        });
        expect(JSON.stringify(result)).not.toContain('internalNote');
        expect(JSON.stringify(result)).not.toContain('paidAmount');
        expect(JSON.stringify(result)).not.toContain('reminderAttemptCount');
    });

    it('exposes a direct appointment read handler for calendar deep links', () => {
        expect(
            (
                controller as unknown as {
                    findOneForStaff?: unknown;
                }
            ).findOneForStaff,
        ).toBeDefined();
    });

    it('returns only fields required by the staff appointment drawer', async () => {
        const appointment = {
            id: 42,
            clientId: 5,
            employeeId: 7,
            serviceId: 10,
            serviceVariantId: null,
            startTime: new Date('2026-09-10T09:00:00.000Z'),
            endTime: new Date('2026-09-10T11:00:00.000Z'),
            status: 'confirmed',
            clientComment: 'Proszę o cichy termin',
            staffRecommendations: 'Maska po koloryzacji',
            onlineAddonsSummary: null,
            onlineTotalDurationMinutes: 120,
            onlineDurationNeedsVerification: false,
            internalNote: 'Receptura w historii',
            extraServices: [],
            paymentMethod: 'card',
            paidAmount: 280,
            tipAmount: 20,
            discount: 0,
            finalizedAt: new Date('2026-09-10T11:05:00.000Z'),
            reminderSent: true,
            reminderAttemptCount: 3,
            createdAt: new Date('2026-09-01T08:00:00.000Z'),
            client: {
                id: 5,
                name: 'Klientka Testowa',
                phone: '+48000000000',
                email: 'client@example.test',
                address: 'Dane zbędne w szufladzie',
                commissionBase: 50,
            },
            employee: {
                id: 7,
                name: 'Pracownik Testowy',
                email: 'staff@example.test',
                phone: '+48111111111',
                commissionBase: 40,
            },
            service: {
                id: 10,
                name: 'Koloryzacja',
                duration: 120,
                price: 280,
                priceType: 'fixed',
                isActive: true,
                onlineBooking: true,
                sortOrder: 1,
                privateDescription: 'Instrukcja wewnętrzna',
                commissionPercent: 35,
            },
        } as Appointment;
        findOne.mockResolvedValue(appointment);

        await expect(
            controller.findOneForStaff(42, {
                userId: 7,
                role: Role.Employee,
            }),
        ).resolves.toEqual({
            id: 42,
            clientId: 5,
            employeeId: 7,
            serviceId: 10,
            serviceVariantId: null,
            startTime: new Date('2026-09-10T09:00:00.000Z'),
            endTime: new Date('2026-09-10T11:00:00.000Z'),
            status: 'confirmed',
            clientComment: 'Proszę o cichy termin',
            staffRecommendations: 'Maska po koloryzacji',
            onlineAddonsSummary: null,
            onlineTotalDurationMinutes: 120,
            onlineDurationNeedsVerification: false,
            internalNote: 'Receptura w historii',
            extraServices: [],
            paymentMethod: 'card',
            paidAmount: 280,
            tipAmount: 20,
            discount: 0,
            finalizedAt: new Date('2026-09-10T11:05:00.000Z'),
            client: {
                id: 5,
                name: 'Klientka Testowa',
                phone: '+48000000000',
                email: 'client@example.test',
            },
            employee: { id: 7, name: 'Pracownik Testowy' },
            service: {
                id: 10,
                name: 'Koloryzacja',
                duration: 120,
                price: 280,
                priceType: 'fixed',
                isActive: true,
                onlineBooking: true,
                sortOrder: 1,
            },
        });
    });

    it('denies an employee access to another employee appointment', async () => {
        findOne.mockResolvedValue({
            id: 42,
            employee: { id: 99 },
        } as Appointment);

        await expect(
            controller.findOneForStaff(42, {
                userId: 7,
                role: Role.Employee,
            }),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows reception to read an appointment assigned to any employee', async () => {
        const appointment = {
            id: 42,
            clientId: 5,
            employeeId: 99,
            serviceId: 10,
            startTime: new Date('2026-09-10T09:00:00.000Z'),
            endTime: new Date('2026-09-10T10:00:00.000Z'),
            status: 'confirmed',
            onlineDurationNeedsVerification: false,
            client: {
                id: 5,
                name: 'Klientka Testowa',
                phone: null,
                email: 'client@example.test',
            },
            employee: { id: 99 },
            service: {
                id: 10,
                name: 'Koloryzacja',
                duration: 60,
                price: 200,
                priceType: 'fixed',
                isActive: true,
                onlineBooking: true,
                sortOrder: 1,
            },
        } as Appointment;
        findOne.mockResolvedValue(appointment);

        await expect(
            controller.findOneForStaff(42, {
                userId: 3,
                role: Role.Receptionist,
            }),
        ).resolves.toMatchObject({
            id: 42,
            employee: { id: 99 },
        });
    });

    it('returns not found for a missing appointment', async () => {
        findOne.mockResolvedValue(null);

        await expect(
            controller.findOneForStaff(404, {
                userId: 1,
                role: Role.Admin,
            }),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('does not let an employee reassign their appointment to a colleague', async () => {
        findOne.mockResolvedValue({
            id: 42,
            employee: { id: 7 },
        } as Appointment);

        await expect(
            controller.reschedule(
                42,
                {
                    startTime: '2026-09-10T09:00:00.000Z',
                    employeeId: 99,
                },
                { userId: 7, role: Role.Employee },
            ),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('does not let an employee create an appointment for a colleague', async () => {
        create.mockResolvedValue({ id: 42 });

        await expect(
            controller.create(
                {
                    clientId: 5,
                    employeeId: 99,
                    serviceId: 10,
                    startTime: '2026-09-10T09:00:00.000Z',
                },
                { userId: 7, role: Role.Employee },
            ),
        ).rejects.toBeInstanceOf(ForbiddenException);
        expect(create).not.toHaveBeenCalled();
    });

    it.each([
        ['appointment conflict check', 'checkConflicts'],
        ['internal note update', 'updateNotes'],
        ['client note update', 'updateClientNote'],
        ['usage suggestion read', 'getUsageSuggestions'],
        ['message thread read', 'listMessages'],
        ['message send', 'addMessage'],
    ])('denies another employee appointment in %s', async (_label, method) => {
        findOne.mockResolvedValue({
            id: 42,
            employee: { id: 99 },
        } as Appointment);

        const user = { userId: 7, role: Role.Employee };
        const action = controller[method as keyof AppointmentsController] as (
            ...args: unknown[]
        ) => Promise<unknown>;
        const argsByMethod: Record<string, unknown[]> = {
            checkConflicts: [
                42,
                '2026-09-10T09:00:00.000Z',
                '2026-09-10T10:00:00.000Z',
                user,
                undefined,
            ],
            updateNotes: [42, { internalNote: 'test' }, user],
            updateClientNote: [42, { clientComment: 'test' }, user],
            getUsageSuggestions: [42, user],
            listMessages: [42, user],
            addMessage: [42, { body: 'test' }, user],
        };

        await expect(
            action.apply(controller, argsByMethod[method]),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });
});
