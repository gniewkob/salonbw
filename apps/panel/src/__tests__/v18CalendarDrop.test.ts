import type { CalendarEvent } from '@/types';
import { classifyV18DropConflict } from '@/utils/v18CalendarDrop';

const appointment = {
    id: 11,
    type: 'appointment',
} as CalendarEvent;
const block = {
    id: 22,
    type: 'time_block',
} as CalendarEvent;

describe('V18 calendar drop conflict classification', () => {
    it('allows admin-only exception for appointment occupancy', () => {
        expect(classifyV18DropConflict([appointment], 'admin')).toBe(
            'appointment-override',
        );
        expect(classifyV18DropConflict([appointment], 'employee')).toBe(
            'forbidden',
        );
        expect(classifyV18DropConflict([appointment], 'receptionist')).toBe(
            'forbidden',
        );
        expect(classifyV18DropConflict([appointment], 'client')).toBe(
            'forbidden',
        );
    });

    it('rejects a time block for every role, even in a mixed collision', () => {
        for (const role of ['admin', 'employee', 'receptionist', 'client']) {
            expect(classifyV18DropConflict([block], role)).toBe('hard-block');
            expect(
                classifyV18DropConflict([appointment, block], role),
            ).toBe('hard-block');
        }
    });

    it('fails closed on ambiguous or incomplete API conflict responses', () => {
        expect(classifyV18DropConflict([], 'admin')).toBe('forbidden');
        expect(classifyV18DropConflict(null, 'admin')).toBe('forbidden');
        expect(
            classifyV18DropConflict(
                [{ id: 4, type: 'unknown' } as unknown as CalendarEvent],
                'admin',
            ),
        ).toBe('forbidden');
    });
});
