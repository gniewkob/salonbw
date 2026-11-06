import { fireEvent, render, screen, within } from '@testing-library/react';
import { useRouter } from 'next/router';
import { useEmployees } from '@/hooks/useEmployees';
import CalendarNav from '@/components/salon/navs/CalendarNav';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('@/hooks/useEmployees', () => ({ useEmployees: jest.fn() }));

const push = jest.fn().mockResolvedValue(true);

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useRouter).mockReturnValue({
        pathname: '/calendar',
        query: { date: '2026-11-14', employeeIds: '7' },
        push,
    } as unknown as ReturnType<typeof useRouter>);
    jest.mocked(useEmployees).mockReturnValue({
        data: [],
    } as unknown as ReturnType<typeof useEmployees>);
});

describe('CalendarNav mini-calendar', () => {
    it('uses one accessible month grid and marks the selected day', () => {
        render(<CalendarNav />);

        const calendar = screen.getByRole('region', { name: 'Mini-kalendarz' });
        expect(within(calendar).getByText('listopad 2026')).toBeInTheDocument();

        const dayGroup = within(calendar).getByRole('group', {
            name: 'Wybór dnia',
        });
        expect(within(dayGroup).getAllByRole('button')).toHaveLength(42);

        const selected = within(dayGroup).getByRole('button', {
            name: 'sobota, 14 listopada 2026',
        });
        expect(selected).toHaveAttribute('aria-pressed', 'true');
        expect(selected.className).toContain('daySelected');
        expect(
            within(dayGroup).getByRole('button', {
                name: 'poniedziałek, 26 października 2026',
            }),
        ).toHaveAttribute('aria-pressed', 'false');
    });

    it('keeps calendar filters when changing the selected day', () => {
        render(<CalendarNav />);

        fireEvent.click(
            screen.getByRole('button', {
                name: 'niedziela, 15 listopada 2026',
            }),
        );

        expect(push).toHaveBeenCalledWith(
            {
                pathname: '/calendar',
                query: { date: '2026-11-15', employeeIds: '7' },
            },
            undefined,
            { shallow: true },
        );
    });

    it('retains month navigation and the date in the URL', () => {
        render(<CalendarNav />);

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Następny miesiąc',
            }),
        );

        expect(push).toHaveBeenCalledWith(
            {
                pathname: '/calendar',
                query: { date: '2026-12-14', employeeIds: '7' },
            },
            undefined,
            { shallow: true },
        );
        expect(screen.getByText('grudzień 2026')).toBeInTheDocument();
    });
});
