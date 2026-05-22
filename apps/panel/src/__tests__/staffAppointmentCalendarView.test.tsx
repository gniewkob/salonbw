import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react';
import StaffAppointmentCalendarView from '@/components/calendar/StaffAppointmentCalendarView';

const cancelMock = jest.fn();
const completeMock = jest.fn();
const updateStatusMock = jest.fn();
const apiFetchMock = jest.fn();

jest.mock('@/hooks/useAppointments', () => ({
    useAppointmentMutations: () => ({
        cancelAppointment: { mutateAsync: cancelMock },
        completeAppointment: { mutateAsync: completeMock },
        updateAppointmentStatus: { mutateAsync: updateStatusMock },
    }),
}));

jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ apiFetch: apiFetchMock }),
}));

jest.mock('@tanstack/react-query', () => ({
    useQuery: jest.fn(() => ({ data: [] })),
    useMutation: jest.fn(() => ({
        mutate: jest.fn(),
        isPending: false,
        isError: false,
    })),
    useQueryClient: jest.fn(() => ({ invalidateQueries: jest.fn() })),
}));

const baseAppointment = {
    id: 101,
    startTime: '2026-05-01T10:00:00.000Z',
    endTime: '2026-05-01T10:45:00.000Z',
    status: 'scheduled',
    client: { id: 5, name: 'Jan Kowalski' },
    employee: { id: 2, name: 'Anna' },
    service: {
        id: 10,
        name: 'Strzyżenie',
        duration: 45,
        price: 120,
        priceType: 'fixed',
        isActive: true,
        onlineBooking: true,
        sortOrder: 0,
    },
};

describe('StaffAppointmentCalendarView', () => {
    beforeEach(() => {
        cancelMock.mockReset();
        completeMock.mockReset();
        updateStatusMock.mockReset();
        apiFetchMock.mockReset();
        apiFetchMock.mockResolvedValue([]);
    });

    it('renders active appointment row and action buttons', () => {
        render(
            <StaffAppointmentCalendarView appointments={[baseAppointment]} />,
        );

        expect(screen.getByText('Strzyżenie')).toBeInTheDocument();
        expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Rozpocznij' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'No-show' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Anuluj' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Otwórz' }),
        ).toBeInTheDocument();
    });

    it('calls updateAppointmentStatus(... in_progress) on Rozpocznij', async () => {
        updateStatusMock.mockResolvedValueOnce(undefined);

        render(
            <StaffAppointmentCalendarView appointments={[baseAppointment]} />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Rozpocznij' }));

        await waitFor(() =>
            expect(updateStatusMock).toHaveBeenCalledWith({
                id: 101,
                status: 'in_progress',
            }),
        );
    });

    it('opens FinalizationModal on Finalizuj for in_progress appointment', () => {
        render(
            <StaffAppointmentCalendarView
                appointments={[{ ...baseAppointment, status: 'in_progress' }]}
            />,
        );
        expect(
            screen.getByRole('button', { name: 'Finalizuj' }),
        ).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Finalizuj' }));
        expect(completeMock).not.toHaveBeenCalled();
    });

    it('calls updateAppointmentStatus(... no_show) on No-show', async () => {
        updateStatusMock.mockResolvedValueOnce(undefined);

        render(
            <StaffAppointmentCalendarView appointments={[baseAppointment]} />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'No-show' }));

        await waitFor(() =>
            expect(updateStatusMock).toHaveBeenCalledWith({
                id: 101,
                status: 'no_show',
            }),
        );
    });

    it('calls cancelAppointment on Anuluj', async () => {
        cancelMock.mockResolvedValueOnce(undefined);

        render(
            <StaffAppointmentCalendarView appointments={[baseAppointment]} />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }));

        await waitFor(() => expect(cancelMock).toHaveBeenCalledWith(101));
    });

    it('hides status actions in read-only mode but keeps Otworz', () => {
        render(
            <StaffAppointmentCalendarView
                appointments={[baseAppointment]}
                readOnly
                emptyTitle="Brak archiwalnych wizyt"
                emptyDescription="Brak danych"
            />,
        );

        expect(
            screen.queryByRole('button', { name: 'Rozpocznij' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'No-show' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Anuluj' }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Otwórz' }),
        ).toBeInTheDocument();
    });

    it('calls onOpenAppointment when Otworz is clicked', () => {
        const onOpenAppointment = jest.fn();

        render(
            <StaffAppointmentCalendarView
                appointments={[baseAppointment]}
                onOpenAppointment={onOpenAppointment}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Otwórz' }));
        expect(onOpenAppointment).toHaveBeenCalledWith(101);
    });

    it('shows neutral error message and keeps appointment row after failed mutation', async () => {
        updateStatusMock.mockRejectedValueOnce(
            new Error('backend stack trace'),
        );

        render(
            <StaffAppointmentCalendarView appointments={[baseAppointment]} />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Rozpocznij' }));

        await waitFor(() =>
            expect(
                screen.getByText('Wystąpił błąd podczas aktualizacji wizyty'),
            ).toBeInTheDocument(),
        );

        const row = screen.getByText('Strzyżenie').closest('article');
        expect(row).not.toBeNull();
        expect(
            within(row as HTMLElement).getByText('Jan Kowalski'),
        ).toBeInTheDocument();
    });
});
