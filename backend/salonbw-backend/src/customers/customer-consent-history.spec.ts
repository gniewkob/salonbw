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
