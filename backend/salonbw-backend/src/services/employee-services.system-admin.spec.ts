import { NotFoundException } from '@nestjs/common';
import { EmployeeServicesService } from './employee-services.service';

function harness() {
    const repository = {
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockResolvedValue([]),
        create: jest.fn((x: unknown) => x),
        save: jest.fn((x: unknown) => Promise.resolve(x)),
        delete: jest.fn(),
    };
    const technical = { id: 2, role: 'admin', isSystemAdmin: true };
    const service = Reflect.construct(EmployeeServicesService, [
        repository,
        { findOne: jest.fn().mockResolvedValue({ id: 1 }) },
        {},
        {
            findOne: jest.fn().mockResolvedValue(technical),
            find: jest.fn().mockResolvedValue([technical]),
        },
        {
            del: jest.fn(),
            wrap: jest.fn((_key: string, loader: () => unknown) => loader()),
        },
    ]) as EmployeeServicesService;
    return { service, repository };
}

describe('service assignments require salon staff', () => {
    it('excludes a technical account from service-provider reads even for a legacy assignment', async () => {
        const h = harness();
        h.repository.find.mockResolvedValue([
            { employee: { id: 1, isSystemAdmin: false } },
            { employee: { id: 2, isSystemAdmin: true } },
        ] as never);
        const assignments = await h.service.findByService(1);
        expect(assignments.map((a) => a.employee.id)).toEqual([1]);
    });

    it('rejects a technical administrator in an individual assignment', async () => {
        const h = harness();
        await expect(
            h.service.create({ employeeId: 2, serviceId: 1 }),
        ).rejects.toBeInstanceOf(NotFoundException);
        expect(h.repository.save).not.toHaveBeenCalled();
    });
    it('rejects a bulk assignment before saving or removing any staff assignment', async () => {
        const h = harness();
        await expect(
            h.service.assignEmployeesToService(1, { employeeIds: [2] }),
        ).rejects.toBeInstanceOf(NotFoundException);
        expect(h.repository.save).not.toHaveBeenCalled();
        expect(h.repository.delete).not.toHaveBeenCalled();
    });
});
