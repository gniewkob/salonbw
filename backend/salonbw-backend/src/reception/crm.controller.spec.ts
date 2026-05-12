import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { CrmController } from './crm.controller';
import { ReceptionService } from './reception.service';

describe('CrmController', () => {
    let controller: CrmController;
    let service: jest.Mocked<ReceptionService>;

    beforeEach(() => {
        service = {
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
});
