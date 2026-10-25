import { BadRequestException } from '@nestjs/common';
import { TimetablesService } from './timetables.service';
import { Role } from '../users/role.enum';
import { User } from '../users/user.entity';

it('refuses a technical-account timetable before deactivating any current schedule', async () => {
    const repository = {
        update: jest.fn(),
        create: jest.fn((x: unknown) => x),
        save: jest.fn((x: unknown) => Promise.resolve(x)),
        findOne: jest
            .fn()
            .mockResolvedValue({ id: 1, employeeId: 2, slots: [] }),
    };
    const user = { id: 2, role: Role.Admin, isSystemAdmin: true };
    const service = Reflect.construct(TimetablesService, [
        repository,
        {},
        {},
        { logAction: jest.fn() },
        { findOne: jest.fn().mockResolvedValue(user) },
    ]) as TimetablesService;
    await expect(
        service.create(
            {
                employeeId: 2,
                name: 'Schedule',
                validFrom: '2026-10-25',
                slots: [],
            },
            { id: 1, role: Role.Admin } as User,
        ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.update).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
});

it('does not return a legacy technical-account timetable as a staff schedule', async () => {
    const records = [
        { id: 1, employee: { isSystemAdmin: false } },
        { id: 2, employee: { isSystemAdmin: true } },
    ];
    const repository = { find: jest.fn().mockResolvedValue(records) };
    const service = Reflect.construct(TimetablesService, [
        repository,
        {},
        {},
        {},
        {},
    ]) as TimetablesService;
    expect((await service.findAll()).map((t) => t.id)).toEqual([1]);
});
