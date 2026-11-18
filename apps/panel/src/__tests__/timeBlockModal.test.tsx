import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

        expect(screen.getByText('Dodaj blokadę')).toBeInTheDocument();
        expect(screen.getByLabelText('Pracownik')).toHaveValue('7');
        expect(screen.getByLabelText('Od')).toHaveValue(
            expect.stringMatching(/^2026-12-08T/),
        );
        fireEvent.change(screen.getByLabelText('Tytuł (opcjonalnie)'), {
            target: { value: 'Przerwa obiadowa' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

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
        fireEvent.submit(screen.getByRole('button', { name: 'Zapisz' }).closest('form')!);
        expect(error).toHaveBeenCalledWith('Wybierz pracownika dla blokady');
        expect(createTimeBlock).not.toHaveBeenCalled();
        fireEvent.change(screen.getByLabelText('Pracownik'), {
            target: { value: '8' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));
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
