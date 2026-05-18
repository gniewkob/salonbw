import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ClientAppointmentHistoryView from '@/components/calendar/ClientAppointmentHistoryView';
import type { Appointment } from '@/types';

function createAppointment(
    id: number,
    overrides: Partial<Appointment> = {},
): Appointment {
    return {
        id,
        startTime: '2026-05-20T10:00:00.000Z',
        endTime: '2026-05-20T10:45:00.000Z',
        status: 'scheduled',
        client: { id: 100, name: 'Jan Kowalski' },
        employee: { id: 7, name: 'Anna Nowak' },
        service: {
            id: 11,
            name: 'Strzyżenie',
            duration: 45,
            price: 120,
            priceType: 'fixed',
            isActive: true,
            onlineBooking: true,
            sortOrder: 0,
        },
        ...overrides,
    };
}

describe('ClientAppointmentHistoryView', () => {
    it('renders future and archived appointment lists', () => {
        const future = [
            createAppointment(1, {
                service: {
                    ...createAppointment(1).service!,
                    name: 'Koloryzacja',
                },
            }),
        ];
        const archived = [
            createAppointment(2, {
                status: 'completed',
                service: {
                    ...createAppointment(2).service!,
                    name: 'Modelowanie',
                },
            }),
        ];

        render(
            <ClientAppointmentHistoryView
                currentDateParam="2026-05-20"
                futureAppointments={future}
                archivedAppointments={archived}
                onDateChange={jest.fn()}
            />,
        );

        expect(screen.getByText('Nadchodzace wizyty')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Koloryzacja/i }),
        ).toBeInTheDocument();
        expect(screen.getByText('Historia wizyt')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Modelowanie/i }),
        ).toBeInTheDocument();
    });

    it('shows empty states for missing future and archived appointments', () => {
        render(
            <ClientAppointmentHistoryView
                currentDateParam="2026-05-20"
                futureAppointments={[]}
                archivedAppointments={[]}
                onDateChange={jest.fn()}
            />,
        );

        expect(
            screen.getByText('Brak nadchodzacych wizyt.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Brak wizyt archiwalnych.'),
        ).toBeInTheDocument();
    });

    it('shows read-only appointment details after appointment click', () => {
        const future = [
            createAppointment(5, {
                status: 'confirmed',
                startTime: '2026-06-11T14:30:00.000Z',
                employee: { id: 22, name: 'Monika Zielinska' },
                service: {
                    ...createAppointment(5).service!,
                    name: 'Masaż',
                },
            }),
        ];

        render(
            <ClientAppointmentHistoryView
                currentDateParam="2026-06-11"
                futureAppointments={future}
                archivedAppointments={[]}
                onDateChange={jest.fn()}
            />,
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: /Masaż/i,
            }),
        );

        const details = screen.getByTestId('client-appointment-details');
        expect(details).toHaveTextContent('Szczegoly wizyty (tylko odczyt)');
        expect(details).toHaveTextContent('Masaż');
        expect(details).toHaveTextContent('confirmed');
        expect(details).toHaveTextContent('Monika Zielinska');
        expect(details).toHaveTextContent('11 cze 2026');
    });

    it('calls onDateChange when date input changes', () => {
        const onDateChange = jest.fn();

        render(
            <ClientAppointmentHistoryView
                currentDateParam="2026-05-20"
                futureAppointments={[]}
                archivedAppointments={[]}
                onDateChange={onDateChange}
            />,
        );

        fireEvent.change(screen.getByLabelText('Data referencyjna'), {
            target: { value: '2026-05-25' },
        });

        expect(onDateChange).toHaveBeenCalledTimes(1);
        const nextDate = onDateChange.mock.calls[0][0] as Date;
        expect(nextDate.getFullYear()).toBe(2026);
        expect(nextDate.getMonth()).toBe(4);
        expect(nextDate.getDate()).toBe(25);
    });

    it('resets details when selected appointment disappears after rerender', () => {
        const selected = createAppointment(9, {
            service: {
                ...createAppointment(9).service!,
                name: 'Peeling',
            },
        });

        const { rerender } = render(
            <ClientAppointmentHistoryView
                currentDateParam="2026-05-20"
                futureAppointments={[selected]}
                archivedAppointments={[]}
                onDateChange={jest.fn()}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /Peeling/i }));
        expect(
            screen.getByTestId('client-appointment-details'),
        ).toHaveTextContent('Peeling');

        rerender(
            <ClientAppointmentHistoryView
                currentDateParam="2026-05-20"
                futureAppointments={[]}
                archivedAppointments={[]}
                onDateChange={jest.fn()}
            />,
        );

        expect(
            screen.getByTestId('client-appointment-details'),
        ).toHaveTextContent('Wybierz wizyte z listy, aby zobaczyc szczegoly.');
    });

    it('does not render mutating action buttons in client read-only view', () => {
        render(
            <ClientAppointmentHistoryView
                currentDateParam="2026-05-20"
                futureAppointments={[createAppointment(1)]}
                archivedAppointments={[createAppointment(2)]}
                onDateChange={jest.fn()}
            />,
        );

        expect(
            screen.queryByRole('button', { name: 'Rozpocznij' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Zakończ' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'No-show' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Anuluj' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Nowa wizyta' }),
        ).not.toBeInTheDocument();
    });

    it('shows cancellation request button only for future appointments', () => {
        render(
            <ClientAppointmentHistoryView
                currentDateParam="2026-05-20"
                futureAppointments={[createAppointment(1)]}
                archivedAppointments={[createAppointment(2)]}
                onDateChange={jest.fn()}
                onRequestCancellation={jest.fn().mockResolvedValue(undefined)}
            />,
        );

        expect(
            screen.getByRole('button', { name: 'Popros o anulowanie' }),
        ).toBeInTheDocument();
        expect(
            screen.getAllByRole('button', { name: 'Popros o anulowanie' }),
        ).toHaveLength(1);
    });

    it('shows success state when cancellation request succeeds', async () => {
        const onRequestCancellation = jest.fn().mockResolvedValue(undefined);
        render(
            <ClientAppointmentHistoryView
                currentDateParam="2026-05-20"
                futureAppointments={[createAppointment(1)]}
                archivedAppointments={[]}
                onDateChange={jest.fn()}
                onRequestCancellation={onRequestCancellation}
            />,
        );

        fireEvent.click(
            screen.getByRole('button', { name: 'Popros o anulowanie' }),
        );

        await waitFor(() =>
            expect(onRequestCancellation).toHaveBeenCalledWith(1),
        );
        expect(
            screen.getByText(
                'Prosba o anulowanie zostala zapisana. Recepcja skontaktuje sie z Toba.',
            ),
        ).toBeInTheDocument();
    });

    it('shows error state when cancellation request fails', async () => {
        const onRequestCancellation = jest
            .fn()
            .mockRejectedValue(new Error('network'));
        render(
            <ClientAppointmentHistoryView
                currentDateParam="2026-05-20"
                futureAppointments={[createAppointment(1)]}
                archivedAppointments={[]}
                onDateChange={jest.fn()}
                onRequestCancellation={onRequestCancellation}
            />,
        );

        fireEvent.click(
            screen.getByRole('button', { name: 'Popros o anulowanie' }),
        );

        await waitFor(() =>
            expect(onRequestCancellation).toHaveBeenCalledWith(1),
        );
        expect(
            screen.getByText(
                'Nie udalo sie wyslac prosby o anulowanie. Sprobuj ponownie.',
            ),
        ).toBeInTheDocument();
    });
});
