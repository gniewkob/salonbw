import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ROLES_KEY } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { CrmController } from './crm.controller';
import { CreateCrmFollowUpActionDto } from './dto/create-crm-follow-up-action.dto';
import { ReceptionService } from './reception.service';

describe('CrmController', () => {
    let controller: CrmController;
    let service: jest.Mocked<ReceptionService>;

    beforeEach(() => {
        service = {
            createFollowUpAction: jest.fn(),
            createOperationalEvent: jest.fn(),
            getOperationalSummary: jest.fn(),
            getOperationalInsights: jest.fn(),
            getFollowUpCandidates: jest.fn(),
        } as unknown as jest.Mocked<ReceptionService>;

        controller = new CrmController(service);
    });

    it('delegates valid follow-up query to service', async () => {
        service.getFollowUpCandidates.mockResolvedValueOnce([]);

        await controller.getFollowUpCandidates({ date: '2026-05-12' });

        expect(service.getFollowUpCandidates).toHaveBeenCalledWith('2026-05-12');
    });

    it('delegates follow-up action payload to service', async () => {
        const payload: CreateCrmFollowUpActionDto = {
            customerId: 123,
            appointmentId: 456,
            candidateReason: 'recent_no_show',
            action: 'contacted',
            note: 'Kontakt wykonany',
            occurredAt: '2026-05-12T10:00:00.000Z',
        };

        service.createFollowUpAction.mockResolvedValueOnce({
            id: 1,
            customerId: 123,
            appointmentId: 456,
            candidateReason: 'recent_no_show',
            action: 'contacted',
            note: 'Kontakt wykonany',
            occurredAt: new Date('2026-05-12T10:00:00.000Z'),
            createdAt: new Date('2026-05-12T10:00:01.000Z'),
        });

        await controller.createFollowUpAction(payload);

        expect(service.createFollowUpAction).toHaveBeenCalledWith(payload);
    });

    it('rejects invalid follow-up date', () => {
        expect(() =>
            controller.getFollowUpCandidates({ date: '12-05-2026' }),
        ).toThrow(BadRequestException);
    });

    it('exposes GET /crm/follow-up-candidates endpoint', () => {
        expect(Reflect.getMetadata(PATH_METADATA, CrmController)).toBe('crm');

        const methodPath = Reflect.getMetadata(
            PATH_METADATA,
            CrmController.prototype.getFollowUpCandidates,
        );
        const method = Reflect.getMetadata(
            METHOD_METADATA,
            CrmController.prototype.getFollowUpCandidates,
        );

        expect(methodPath).toBe('follow-up-candidates');
        expect(method).toBe(0);
    });

    it('exposes POST /crm/follow-up-actions endpoint', () => {
        const methodPath = Reflect.getMetadata(
            PATH_METADATA,
            CrmController.prototype.createFollowUpAction,
        );
        const method = Reflect.getMetadata(
            METHOD_METADATA,
            CrmController.prototype.createFollowUpAction,
        );

        expect(methodPath).toBe('follow-up-actions');
        expect(method).toBe(1);
    });

    it('requires Admin/Employee/Receptionist roles on follow-up endpoint', () => {
        const roles = Reflect.getMetadata(
            ROLES_KEY,
            CrmController.prototype.getFollowUpCandidates,
        ) as Role[];

        expect(roles).toEqual([
            Role.Admin,
            Role.Employee,
            Role.Receptionist,
        ]);
    });

    it('requires Admin/Employee/Receptionist roles on follow-up action endpoint', () => {
        const roles = Reflect.getMetadata(
            ROLES_KEY,
            CrmController.prototype.createFollowUpAction,
        ) as Role[];

        expect(roles).toEqual([
            Role.Admin,
            Role.Employee,
            Role.Receptionist,
        ]);
    });
});

describe('CreateCrmFollowUpActionDto validation', () => {
    it('accepts valid payload', async () => {
        const dto = plainToInstance(CreateCrmFollowUpActionDto, {
            customerId: 123,
            appointmentId: 456,
            candidateReason: 'recent_no_show',
            action: 'contacted',
            note: 'Krótka notatka',
            occurredAt: '2026-05-12T10:00:00.000Z',
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('rejects unknown action', async () => {
        const dto = plainToInstance(CreateCrmFollowUpActionDto, {
            customerId: 123,
            appointmentId: 456,
            candidateReason: 'recent_no_show',
            action: 'unknown_action',
        });

        const errors = await validate(dto);
        expect(errors.some((error) => error.property === 'action')).toBe(true);
    });

    it('rejects unknown candidateReason', async () => {
        const dto = plainToInstance(CreateCrmFollowUpActionDto, {
            customerId: 123,
            appointmentId: 456,
            candidateReason: 'legacy_reason',
            action: 'deferred',
        });

        const errors = await validate(dto);
        expect(
            errors.some((error) => error.property === 'candidateReason'),
        ).toBe(true);
    });

    it('rejects invalid id types', async () => {
        const dto = plainToInstance(CreateCrmFollowUpActionDto, {
            customerId: 'abc',
            appointmentId: 'def',
            candidateReason: 'high_risk_no_contact',
            action: 'escalated',
        });

        const errors = await validate(dto);
        expect(errors.some((error) => error.property === 'customerId')).toBe(
            true,
        );
        expect(
            errors.some((error) => error.property === 'appointmentId'),
        ).toBe(true);
    });
});
