import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CalendarQueryDto } from './calendar-query.dto';

function expectValid(payload: Record<string, unknown>) {
    const dto = plainToInstance(CalendarQueryDto, payload);
    const errors = validateSync(dto);
    expect(errors).toHaveLength(0);
}

function expectInvalid(payload: Record<string, unknown>) {
    const dto = plainToInstance(CalendarQueryDto, payload);
    const errors = validateSync(dto);
    expect(errors.length).toBeGreaterThan(0);
}

describe('CalendarQueryDto', () => {
    it('accepts date + comma separated employee ids', () => {
        expectValid({
            date: '2026-05-27',
            view: 'day',
            employeeIds: '1,2,3',
        });
    });

    it('accepts date + single employee id as string', () => {
        expectValid({
            date: '2026-05-27T00:00:00.000Z',
            view: 'reception',
            employeeIds: '12',
        });
    });

    it('accepts repeated query style array values', () => {
        expectValid({
            date: '2026-05-27',
            view: 'week',
            employeeIds: ['4', '5'],
        });
    });

    it('rejects non-numeric employee ids', () => {
        expectInvalid({
            date: '2026-05-27',
            view: 'day',
            employeeIds: '1,abc',
        });
    });
});
