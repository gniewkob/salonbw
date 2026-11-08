import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { DataSource, EntityManager } from 'typeorm';
import { Role } from '../users/role.enum';
import {
    CommunicationChannel,
    ConsentPurpose,
    ConsentSource,
} from './communication-consent.types';
import { CommunicationConsentsService } from './communication-consents.service';
import { WithdrawDirectMarketingDto } from './dto/consent.dto';

const C = CommunicationChannel;

describe('Atomic direct-marketing withdrawal', () => {
    it('rejects duplicate, unsupported and empty channels at the API boundary', async () => {
        for (const channels of [
            [],
            [C.Panel],
            [C.Sms, C.Sms],
        ]) {
            const dto = plainToInstance(WithdrawDirectMarketingDto, {
                channels,
            });
            expect(await validate(dto)).not.toHaveLength(0);
        }
        expect(
            await validate(
                plainToInstance(WithdrawDirectMarketingDto, {
                    channels: [C.Sms, C.WhatsApp, C.Email],
                }),
            ),
        ).toHaveLength(0);
    });

    const setup = () => {
        const manager = {
            findOne: jest.fn().mockResolvedValue(null),
            save: jest.fn().mockResolvedValue({ id: 42 }),
        } as unknown as EntityManager;
        const transaction = jest.fn(
            async (fn: (manager: EntityManager) => Promise<unknown>) =>
                fn(manager),
        );
        const service = new CommunicationConsentsService({
            transaction,
        } as unknown as DataSource);
        const applyWithdraw = jest.fn().mockResolvedValue(undefined);
        const lockCustomer = jest.fn().mockResolvedValue({
            id: 20,
            role: Role.Client,
        });
        Object.assign(service, {
            lockCustomer,
            applyWithdraw,
            getState: jest.fn().mockResolvedValue({ customerId: 20 }),
        });
        return { service, manager, transaction, applyWithdraw, lockCustomer };
    };

    it('withdraws SMS, WhatsApp and e-mail in a single transaction and preserves purpose', async () => {
        const { service, manager, transaction, applyWithdraw } = setup();
        const actor = { id: 20, role: Role.Client };
        const result = await service.withdrawDirectMarketing(
            20,
            { channels: [C.Sms, C.WhatsApp, C.Email] },
            actor,
            'self',
        );

        expect(transaction).toHaveBeenCalledTimes(1);
        expect(result.customerId).toBe(20);
        expect(applyWithdraw).toHaveBeenCalledTimes(3);
        for (const channel of [C.Email, C.Sms, C.WhatsApp]) {
            expect(applyWithdraw).toHaveBeenCalledWith(
                manager,
                20,
                actor,
                ConsentPurpose.DirectMarketing,
                channel,
                ConsentSource.SelfServicePanel,
            );
        }
    });

    it('supports a two-channel group and records a staff-requested withdrawal', async () => {
        const { service, applyWithdraw, transaction } = setup();
        await service.withdrawDirectMarketing(
            20,
            { channels: [C.WhatsApp, C.Sms] },
            { id: 7, role: Role.Receptionist },
            'staff',
        );
        expect(transaction).toHaveBeenCalledTimes(1);
        expect(applyWithdraw).toHaveBeenCalledTimes(2);
        expect(applyWithdraw).toHaveBeenCalledWith(
            expect.anything(),
            20,
            { id: 7, role: Role.Receptionist },
            ConsentPurpose.DirectMarketing,
            C.WhatsApp,
            ConsentSource.StaffOnCustomerRequest,
        );
    });

    it('replays the same idempotency key without additional withdrawals', async () => {
        const { service, manager, applyWithdraw } = setup();
        const channels = [C.Sms, C.WhatsApp];
        const hash = createHash('sha256')
            .update(
                JSON.stringify({
                    action: 'WITHDRAW_DIRECT_MARKETING',
                    channels: [C.Sms, C.WhatsApp],
                }),
            )
            .digest('hex');
        const findOne = manager.findOne as unknown as jest.Mock;
        findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ payloadHash: hash });
        const actor = { id: 20, role: Role.Client };

        await service.withdrawDirectMarketing(
            20,
            { channels },
            actor,
            'self',
            'marketing-withdrawal-42',
        );
        await service.withdrawDirectMarketing(
            20,
            { channels: [C.WhatsApp, C.Sms] },
            actor,
            'self',
            'marketing-withdrawal-42',
        );
        expect(applyWithdraw).toHaveBeenCalledTimes(2);
        expect(manager.save).toHaveBeenCalledTimes(1);
    });

    it('rejects reuse of the same key for different channels', async () => {
        const { service, manager, applyWithdraw } = setup();
        const hash = createHash('sha256')
            .update(
                JSON.stringify({
                    action: 'WITHDRAW_DIRECT_MARKETING',
                    channels: [C.Sms],
                }),
            )
            .digest('hex');
        const findOne = manager.findOne as unknown as jest.Mock;
        findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ payloadHash: hash });
        const actor = { id: 20, role: Role.Client };
        await service.withdrawDirectMarketing(
            20,
            { channels: [C.Sms] },
            actor,
            'self',
            'same-key',
        );
        await expect(
            service.withdrawDirectMarketing(
                20,
                { channels: [C.Email] },
                actor,
                'self',
                'same-key',
            ),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(applyWithdraw).toHaveBeenCalledTimes(1);
    });

    it('rejects unsupported or duplicate channels even when validation is bypassed', async () => {
        const { service, transaction } = setup();
        for (const channels of [
            [],
            [C.Panel],
            [C.Sms, C.Sms],
        ]) {
            await expect(
                service.withdrawDirectMarketing(
                    20,
                    { channels },
                    { id: 20, role: Role.Client },
                    'self',
                ),
            ).rejects.toBeInstanceOf(BadRequestException);
        }
        expect(transaction).not.toHaveBeenCalled();
    });

    it('denies withdrawing another customer’s consents from self-service', async () => {
        const { service, transaction } = setup();
        await expect(
            service.withdrawDirectMarketing(
                20,
                { channels: [C.Sms] },
                { id: 21, role: Role.Client },
                'self',
            ),
        ).rejects.toBeInstanceOf(ForbiddenException);
        expect(transaction).not.toHaveBeenCalled();
    });

    it('rejects the whole mutation when any per-channel withdrawal fails', async () => {
        const { service, applyWithdraw, transaction } = setup();
        applyWithdraw
            .mockResolvedValueOnce(undefined)
            .mockRejectedValueOnce(new Error('database constraint'));
        await expect(
            service.withdrawDirectMarketing(
                20,
                { channels: [C.Sms, C.WhatsApp, C.Email] },
                { id: 20, role: Role.Client },
                'self',
            ),
        ).rejects.toThrow('database constraint');
        expect(transaction).toHaveBeenCalledTimes(1);
    });
});
