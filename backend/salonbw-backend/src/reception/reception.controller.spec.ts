import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ROLES_KEY } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { ReceptionController } from './reception.controller';
import { CreateReceptionOperationalEventDto } from './dto/create-reception-operational-event.dto';
import { ReceptionService } from './reception.service';

describe('ReceptionController', () => {
    let controller: ReceptionController;
    let service: jest.Mocked<ReceptionService>;

    beforeEach(() => {
        service = {
            createOperationalEvent: jest.fn(),
            getOperationalSummary: jest.fn(),
        } as unknown as jest.Mocked<ReceptionService>;

        controller = new ReceptionController(service);
    });

    it('delegates valid payload to service', async () => {
        const payload: CreateReceptionOperationalEventDto = {
            eventName: 'reception_operational_action',
            action: 'confirm_appointment',
            appointmentId: 77,
            customerId: 15,
            customerAlertSeverity: 'warning',
            source: 'reception_view',
            occurredAt: '2026-05-11T12:00:00.000Z',
        };

        service.createOperationalEvent.mockResolvedValueOnce({
            id: 1,
            ...payload,
            customerId: payload.customerId ?? null,
            customerAlertSeverity: payload.customerAlertSeverity ?? null,
            occurredAt: new Date(payload.occurredAt),
            createdAt: new Date('2026-05-11T12:00:01.000Z'),
        });

        await controller.createOperationalEvent(payload);

        expect(service.createOperationalEvent).toHaveBeenCalledWith(payload);
    });

    it('exposes POST /reception/operational-events endpoint', () => {
        expect(Reflect.getMetadata(PATH_METADATA, ReceptionController)).toBe(
            'reception',
        );

        const methodPath = Reflect.getMetadata(
            PATH_METADATA,
            ReceptionController.prototype.createOperationalEvent,
        );
        const method = Reflect.getMetadata(
            METHOD_METADATA,
            ReceptionController.prototype.createOperationalEvent,
        );

        expect(methodPath).toBe('operational-events');
        expect(method).toBe(1);
    });

    it('requires Admin/Employee/Receptionist roles on endpoint', () => {
        const roles = Reflect.getMetadata(
            ROLES_KEY,
            ReceptionController.prototype.createOperationalEvent,
        ) as Role[];

        expect(roles).toEqual([
            Role.Admin,
            Role.Employee,
            Role.Receptionist,
        ]);
    });

    it('delegates operational summary query to service', async () => {
        service.getOperationalSummary.mockResolvedValueOnce({
            date: '2026-05-11',
            actionsTotal: 4,
            actionsOnAlerts: 2,
        });

        await controller.getOperationalSummary({ date: '2026-05-11' });

        expect(service.getOperationalSummary).toHaveBeenCalledWith(
            '2026-05-11',
        );
    });

    it('rejects invalid operational summary date', async () => {
        expect(() =>
            controller.getOperationalSummary({ date: '11-05-2026' }),
        ).toThrow(BadRequestException);
    });

    it('exposes GET /reception/operational-summary endpoint', () => {
        const methodPath = Reflect.getMetadata(
            PATH_METADATA,
            ReceptionController.prototype.getOperationalSummary,
        );
        const method = Reflect.getMetadata(
            METHOD_METADATA,
            ReceptionController.prototype.getOperationalSummary,
        );

        expect(methodPath).toBe('operational-summary');
        expect(method).toBe(0);
    });

    it('requires Admin/Employee/Receptionist roles on summary endpoint', () => {
        const roles = Reflect.getMetadata(
            ROLES_KEY,
            ReceptionController.prototype.getOperationalSummary,
        ) as Role[];

        expect(roles).toEqual([
            Role.Admin,
            Role.Employee,
            Role.Receptionist,
        ]);
    });
});

describe('CreateReceptionOperationalEventDto validation', () => {
    it('accepts valid payload', async () => {
        const dto = plainToInstance(CreateReceptionOperationalEventDto, {
            eventName: 'reception_operational_action',
            action: 'open_customer_profile',
            appointmentId: 10,
            customerId: 21,
            customerAlertSeverity: 'danger',
            source: 'appointment_drawer',
            occurredAt: '2026-05-11T12:00:00.000Z',
        });

        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
    });

    it('rejects unknown action', async () => {
        const dto = plainToInstance(CreateReceptionOperationalEventDto, {
            eventName: 'reception_operational_action',
            action: 'unknown_action',
            appointmentId: 10,
            source: 'calendar',
        });

        const errors = await validate(dto);

        expect(errors.some((error) => error.property === 'action')).toBe(true);
    });

    it('rejects unknown source', async () => {
        const dto = plainToInstance(CreateReceptionOperationalEventDto, {
            eventName: 'reception_operational_action',
            action: 'start_appointment',
            appointmentId: 10,
            source: 'api_gateway',
        });

        const errors = await validate(dto);

        expect(errors.some((error) => error.property === 'source')).toBe(true);
    });

    it('rejects unknown customerAlertSeverity', async () => {
        const dto = plainToInstance(CreateReceptionOperationalEventDto, {
            eventName: 'reception_operational_action',
            action: 'mark_no_show',
            appointmentId: 10,
            source: 'reception_view',
            customerAlertSeverity: 'critical',
        });

        const errors = await validate(dto);

        expect(
            errors.some((error) => error.property === 'customerAlertSeverity'),
        ).toBe(true);
    });

    it('rejects invalid eventName', async () => {
        const dto = plainToInstance(CreateReceptionOperationalEventDto, {
            eventName: 'calendar_click',
            action: 'open_sale_detail',
            appointmentId: 10,
            source: 'calendar',
        });

        const errors = await validate(dto);

        expect(errors.some((error) => error.property === 'eventName')).toBe(
            true,
        );
    });

    it('rejects invalid id types', async () => {
        const dto = plainToInstance(CreateReceptionOperationalEventDto, {
            eventName: 'reception_operational_action',
            action: 'finalize_via_drawer',
            appointmentId: 'abc',
            customerId: 'def',
            source: 'reception_view',
        });

        const errors = await validate(dto);

        expect(
            errors.some((error) => error.property === 'appointmentId'),
        ).toBe(true);
        expect(errors.some((error) => error.property === 'customerId')).toBe(
            true,
        );
    });
});
