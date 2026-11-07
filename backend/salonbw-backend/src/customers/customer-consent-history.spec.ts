import { Repository } from 'typeorm';
import { CustomersService } from './customers.service';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { User } from '../users/user.entity';

describe('CustomersService.getConsentHistory', () => {
    it('returns recorded customer consent changes without unrelated fields', async () => {
        const logs = {
            findAll: jest.fn().mockResolvedValue({
                data: [
                    {
                        id: 12,
                        timestamp: new Date('2026-11-07T10:00:00Z'),
                        description: {
                            customerId: 20,
                            changes: {
                                smsConsent: { from: false, to: true },
                                password: { from: false, to: true },
                                ignored: { from: 'no', to: 'yes' },
                            },
                        },
                    },
                    {
                        id: 11,
                        timestamp: new Date('2026-11-06T10:00:00Z'),
                        description: {
                            customerId: 99,
                            changes: {
                                emailConsent: { from: false, to: true },
                            },
                        },
                    },
                ],
            }),
        } as unknown as LogService;
        const unused = {} as Repository<never>;
        const service = new CustomersService(
            logs,
            unused as Repository<User>,
            unused,
            unused,
            unused,
            unused,
            unused,
            unused,
        );
        jest.spyOn(service, 'findOne').mockResolvedValue({
            id: 20,
        } as User);

        await expect(service.getConsentHistory(20)).resolves.toEqual({
            available: true,
            items: [
                {
                    id: '12:smsConsent',
                    timestamp: '2026-11-07T10:00:00.000Z',
                    field: 'smsConsent',
                    previous: false,
                    current: true,
                    actorId: null,
                },
            ],
        });
        expect(logs.findAll).toHaveBeenCalledWith({
            userId: 20,
            action: LogAction.CONSENT_UPDATED,
            page: 1,
            limit: 100,
        });
    });

    it('indicates when the legacy audit service is unavailable', async () => {
        const unused = {} as Repository<never>;
        const service = new CustomersService(
            null,
            unused as Repository<User>,
            unused,
            unused,
            unused,
            unused,
            unused,
            unused,
        );
        jest.spyOn(service, 'findOne').mockResolvedValue({
            id: 20,
        } as User);

        await expect(service.getConsentHistory(20)).resolves.toEqual({
            items: [],
            available: false,
        });
    });
});

describe('CustomersService.update consent audit ordering', () => {
    const unused = {} as Repository<never>;

    it('records the actor after customer persistence succeeds', async () => {
        const save = jest.fn().mockResolvedValue({
            id: 20,
            smsConsent: true,
        });
        const logAction = jest.fn().mockResolvedValue(undefined);
        const service = new CustomersService(
            { logAction } as unknown as LogService,
            { save } as unknown as Repository<User>,
            unused,
            unused,
            unused,
            unused,
            unused,
            unused,
        );
        jest.spyOn(service, 'findOne').mockResolvedValue({
            id: 20,
            smsConsent: false,
        } as User);

        await service.update(20, { smsConsent: true }, 55);

        expect(save).toHaveBeenCalledTimes(1);
        expect(logAction).toHaveBeenCalledWith(
            { id: 20 },
            LogAction.CONSENT_UPDATED,
            expect.objectContaining({
                customerId: 20,
                actorId: 55,
                source: 'staff_crm',
                changes: { smsConsent: { from: false, to: true } },
            }),
        );
        expect(save.mock.invocationCallOrder[0]).toBeLessThan(
            logAction.mock.invocationCallOrder[0],
        );
    });

    it('does not record a false change if customer persistence fails', async () => {
        const save = jest.fn().mockRejectedValue(new Error('DB rejected'));
        const logAction = jest.fn();
        const service = new CustomersService(
            { logAction } as unknown as LogService,
            { save } as unknown as Repository<User>,
            unused,
            unused,
            unused,
            unused,
            unused,
            unused,
        );
        jest.spyOn(service, 'findOne').mockResolvedValue({
            id: 20,
            smsConsent: false,
        } as User);

        await expect(
            service.update(20, { smsConsent: true }, 55),
        ).rejects.toThrow('DB rejected');
        expect(logAction).not.toHaveBeenCalled();
    });
});
