import { fireEvent, render, screen } from '@testing-library/react';
import CalendarHeader from '@/components/calendar/CalendarHeader';

describe('CalendarHeader', () => {
    it('exposes the implemented reception view in the calendar switcher', () => {
        const onViewChange = jest.fn();

        render(
            <CalendarHeader
                date={new Date('2026-07-29T12:00:00Z')}
                view="day"
                onDateChange={jest.fn()}
                onViewChange={onViewChange}
                onTodayClick={jest.fn()}
            />,
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Recepcja',
            }),
        );

        expect(onViewChange).toHaveBeenCalledWith('reception');
    });
});
