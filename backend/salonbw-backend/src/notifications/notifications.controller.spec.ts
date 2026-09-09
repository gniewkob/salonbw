import { AppointmentStatus } from '../appointments/appointment.entity';
import { Role } from '../users/role.enum';
import { NotificationsController } from './notifications.controller';

function queryBuilderReturning(messages: unknown[]) {
    const builder: Record<string, jest.Mock> = {};
    for (const method of [
        'innerJoinAndSelect',
        'leftJoinAndSelect',
        'where',
        'andWhere',
        'orderBy',
        'addOrderBy',
        'take',
    ]) {
        builder[method] = jest.fn(() => builder);
    }
    builder.getMany = jest.fn(async () => messages);
    builder.getCount = jest.fn(async () => messages.length);
    return builder;
}

function appointmentQueryBuilder() {
    const builder: Record<string, jest.Mock> = {};
    for (const method of [
        'leftJoinAndSelect',
        'where',
        'andWhere',
        'orderBy',
        'take',
    ]) {
        builder[method] = jest.fn(() => builder);
    }
    builder.getMany = jest.fn(async () => []);
    return builder;
}

describe('NotificationsController appointment messages', () => {
    const message = {
        id: 51,
        appointmentId: 42,
        authorRole: Role.Admin,
        body: 'Treść prywatnej rozmowy nie może trafić do powiadomienia',
        createdAt: new Date('2026-09-08T09:00:00.000Z'),
        appointment: {
            id: 42,
            status: AppointmentStatus.Confirmed,
            service: { name: 'Koloryzacja' },
            client: { name: 'Klientka testowa' },
        },
    };

    it('gives the client a private deep link to the exact thread', async () => {
        const appointments = {
            find: jest.fn(async () => []),
            createQueryBuilder: jest.fn(() => appointmentQueryBuilder()),
        };
        const messages = {
            createQueryBuilder: jest.fn(() => queryBuilderReturning([message])),
        };
        const controller = new (NotificationsController as any)(
            appointments,
            messages,
        );

        const result = await controller.getNotifications({
            userId: 7,
            role: Role.Client,
        });

        expect(result).toContainEqual(
            expect.objectContaining({
                id: 'message-51',
                type: 'appointment_message_action',
                appointmentId: 42,
                actionHref: '/visits?visitId=42',
                actionLabel: 'Otwórz rozmowę',
            }),
        );
        expect(JSON.stringify(result)).not.toContain('Treść prywatnej rozmowy');
    });

    it('gives staff a deep link when the client wrote last', async () => {
        const appointments = {
            find: jest.fn(async () => []),
            createQueryBuilder: jest.fn(() => appointmentQueryBuilder()),
        };
        const clientMessage = { ...message, authorRole: Role.Client };
        const messages = {
            createQueryBuilder: jest.fn(() =>
                queryBuilderReturning([clientMessage]),
            ),
        };
        const controller = new (NotificationsController as any)(
            appointments,
            messages,
        );

        const result = await controller.getNotifications({
            userId: 1,
            role: Role.Admin,
        });

        expect(result).toContainEqual(
            expect.objectContaining({
                id: 'message-51',
                type: 'appointment_message_action',
                appointmentId: 42,
                actionHref: '/calendar?appointmentId=42',
                actionLabel: 'Otwórz rozmowę',
            }),
        );
    });

    it('counts pending bookings and client-authored threads for the staff badge', async () => {
        const appointments = {
            count: jest.fn(async () => 2),
            find: jest.fn(async () => []),
            createQueryBuilder: jest.fn(() => appointmentQueryBuilder()),
        };
        const messages = {
            createQueryBuilder: jest.fn(() =>
                queryBuilderReturning([
                    { ...message, authorRole: Role.Client },
                    { ...message, id: 52, authorRole: Role.Client },
                    { ...message, id: 53, authorRole: Role.Client },
                ]),
            ),
        };
        const controller = new (NotificationsController as any)(
            appointments,
            messages,
        );

        await expect(
            (controller as any).getActionableCount({
                userId: 1,
                role: Role.Admin,
            }),
        ).resolves.toEqual({ count: 5 });
    });
});
