import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { format } from 'date-fns';
import TimeBlockModal from '@/components/calendar/TimeBlockModal';
import { useCalendarMutations } from '@/hooks/useCalendar';
import { useToast } from '@/contexts/ToastContext';
import type { Employee } from '@/types';

jest.mock('@/hooks/useCalendar', () => ({
    useCalendarMutations: jest.fn(),
}));
jest.mock('@/contexts/ToastContext', () => ({
    useToast: jest.fn(),
}));

const createTimeBlock = jest.fn();
const updateTimeBlock = jest.fn();
const deleteTimeBlock = jest.fn();
const success = jest.fn();
const error = jest.fn();

const oneEmployee = [{ id: 7, name: 'Ola' }] as Employee[];

beforeEach(() => {
    jest.clearAllMocks();
    createTimeBlock.mockResolvedValue({ id: 1 });
    jest.mocked(useCalendarMutations).mockReturnValue({
        createTimeBlock: { mutateAsync: createTimeBlock },
        updateTimeBlock: { mutateAsync: updateTimeBlock },
        deleteTimeBlock: { mutateAsync: deleteTimeBlock },
    } as unknown as ReturnType<typeof useCalendarMutations>);
    jest.mocked(useToast).mockReturnValue({
        success,
        error,
    } as unknown as ReturnType<typeof useToast>);
});

describe('TimeBlockModal creation', () => {
    it('creates one block for the sole performer with the selected range', async () => {
        const onSaved = jest.fn();
        const onClose = jest.fn();
        const start = new Date('2026-12-08T09:15:00.000Z');
        const end = new Date('2026-12-08T09:45:00.000Z');
        render(
            <TimeBlockModal
                open
                employees={oneEmployee}
                initialStartTime={start}
                initialEndTime={end}
                initialEmployeeId={7}
                onSaved={onSaved}
                onClose={onClose}
            />,
        );

        expect(screen.getByRole('heading', { name: 'Dodaj blokadę' })).toBeInTheDocument();
        expect(screen.getByLabelText('Pracownik')).toHaveValue('7');
        // datetime-local exposes local wall time; comparing the rendered
        // value against date-fns avoids assuming UTC or the runner timezone.
        expect(screen.getByLabelText('Od')).toHaveValue(
            format(start, "yyyy-MM-dd'T'HH:mm"),
        );
        expect(screen.getByLabelText('Do')).toHaveValue(
            format(end, "yyyy-MM-dd'T'HH:mm"),
        );
        fireEvent.change(screen.getByLabelText('Tytuł (opcjonalnie)'), {
            target: { value: 'Przerwa obiadowa' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Dodaj blokadę' }));

        await waitFor(() => expect(createTimeBlock).toHaveBeenCalledTimes(1));
        expect(createTimeBlock).toHaveBeenCalledWith({
            employeeId: 7,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            type: 'break',
            title: 'Przerwa obiadowa',
            notes: undefined,
            allDay: false,
        });
        await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(success).toHaveBeenCalledWith('Blokada dodana');
    });

    it('uses the Studio V18 booking modal design only when explicitly requested', () => {
        const props = {
            open: true,
            employees: oneEmployee,
            initialEmployeeId: 7,
            onSaved: jest.fn(),
            onClose: jest.fn(),
        };

        const { rerender } = render(
            <TimeBlockModal {...props} visualVariant="v18" />,
        );
        const dialog = screen.getByRole('dialog', { name: 'Dodaj blokadę' });
        expect(dialog).toHaveClass('modal');
        expect(screen.getByText('Salon Black & White · CRM V18')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: 'Dodaj blokadę' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 3, name: 'Blokada' })).toBeInTheDocument();
        expect(screen.getByLabelText('Rodzaj blokady')).toHaveValue('break');

        rerender(<TimeBlockModal {...props} visualVariant="legacy" />);
        expect(screen.queryByText('Salon Black & White · CRM V18')).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { level: 3, name: 'Blokada' })).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 5, name: 'Dodaj blokadę' })).toBeInTheDocument();
    });

    it('preserves time-block mutations in the V18 visual variant', async () => {
        const onSaved = jest.fn();
        render(
            <TimeBlockModal
                open
                visualVariant="v18"
                employees={oneEmployee}
                initialEmployeeId={7}
                initialStartTime={new Date('2026-12-08T10:00:00.000Z')}
                initialEndTime={new Date('2026-12-08T10:15:00.000Z')}
                onSaved={onSaved}
                onClose={jest.fn()}
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Dodaj blokadę' }));
        await waitFor(() => expect(createTimeBlock).toHaveBeenCalledTimes(1));
        expect(createTimeBlock.mock.calls[0][0]).toEqual(
            expect.objectContaining({
                employeeId: 7,
                type: 'break',
                startTime: '2026-12-08T10:00:00.000Z',
                endTime: '2026-12-08T10:15:00.000Z',
            }),
        );
        expect(onSaved).toHaveBeenCalledTimes(1);
    });

    it('does not silently select the first worker in a multi-employee salon', async () => {
        const employees = [
            { id: 7, name: 'Ola' },
            { id: 8, name: 'Drugi pracownik' },
        ] as Employee[];
        render(
            <TimeBlockModal
                open
                employees={employees}
                onSaved={jest.fn()}
                onClose={jest.fn()}
            />,
        );
        expect(screen.getByLabelText('Pracownik')).toHaveValue('0');
        fireEvent.submit(screen.getByRole('button', { name: 'Dodaj blokadę' }).closest('form')!);
        expect(error).toHaveBeenCalledWith('Wybierz pracownika dla blokady');
        expect(createTimeBlock).not.toHaveBeenCalled();
        fireEvent.change(screen.getByLabelText('Pracownik'), {
            target: { value: '8' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Dodaj blokadę' }));
        await waitFor(() => expect(createTimeBlock).toHaveBeenCalledTimes(1));
        expect(createTimeBlock.mock.calls[0][0].employeeId).toBe(8);
    });

    it('does not persist a block when the operator cancels', () => {
        const onClose = jest.fn();
        render(
            <TimeBlockModal
                open
                employees={oneEmployee}
                onSaved={jest.fn()}
                onClose={onClose}
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }));
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(createTimeBlock).not.toHaveBeenCalled();
    });
});
