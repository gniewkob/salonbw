import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ReceptionView from '@/components/calendar/ReceptionView';

const cancelMock = jest.fn();
const updateStatusMock = jest.fn();

jest.mock('@/hooks/useAppointments', () => ({
    useAppointmentMutations: () => ({
        cancelAppointment: { mutateAsync: cancelMock },
        updateAppointmentStatus: { mutateAsync: updateStatusMock },
    }),
}));

describe('ReceptionView', () => {
    beforeEach(() => {
        cancelMock.mockReset();
        updateStatusMock.mockReset();
    });

    it('shows pending state for clicked action and restores label after success', async () => {
        let resolveStart: (() => void) | null = null;
        const pending = new Promise<void>((resolve) => {
            resolveStart = resolve;
        });
        updateStatusMock.mockImplementation(() => pending);

        render(
            <ReceptionView
                appointments={[
                    {
                        id: 1,
                        startTime: '2026-05-01T10:00:00.000Z',
                        endTime: '2026-05-01T10:45:00.000Z',
                        status: 'scheduled',
                        client: { id: 5, name: 'Jan Kowalski' },
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
                        employee: { id: 2, name: 'Anna' },
                    },
                ]}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Rozpocznij' }));

        expect(screen.getByRole('button', { name: 'Trwa...' })).toBeVisible();

        resolveStart?.();

        await waitFor(() =>
            expect(
                screen.getByRole('button', { name: 'Rozpocznij' }),
            ).toBeVisible(),
        );
    });

    it('renders inline error when action fails', async () => {
        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => undefined);
        updateStatusMock.mockRejectedValueOnce(new Error('Backend failed'));

        render(
            <ReceptionView
                appointments={[
                    {
                        id: 2,
                        startTime: '2026-05-01T11:00:00.000Z',
                        endTime: '2026-05-01T11:45:00.000Z',
                        status: 'scheduled',
                        client: { id: 6, name: 'Anna Nowak' },
                        service: {
                            id: 11,
                            name: 'Koloryzacja',
                            duration: 45,
                            price: 180,
                            priceType: 'fixed',
                            isActive: true,
                            onlineBooking: true,
                            sortOrder: 0,
                        },
                        employee: { id: 3, name: 'Ewa' },
                    },
                ]}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Potwierdź' }));

        await waitFor(() =>
            expect(
                screen.getByText(/Wystąpił błąd podczas aktualizacji wizyty/i),
            ).toBeInTheDocument(),
        );
        consoleErrorSpy.mockRestore();
    });

    it('routes in_progress appointment to finalize flow callback', () => {
        const onOpenFinalizeAppointment = jest.fn();

        render(
            <ReceptionView
                appointments={[
                    {
                        id: 3,
                        startTime: '2026-05-01T12:00:00.000Z',
                        endTime: '2026-05-01T12:45:00.000Z',
                        status: 'in_progress',
                        client: { id: 7, name: 'Katarzyna Zielińska' },
                        service: {
                            id: 12,
                            name: 'Modelowanie',
                            duration: 45,
                            price: 140,
                            priceType: 'fixed',
                            isActive: true,
                            onlineBooking: true,
                            sortOrder: 0,
                        },
                        employee: { id: 4, name: 'Magda' },
                    },
                ]}
                onOpenFinalizeAppointment={onOpenFinalizeAppointment}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Finalizuj' }));

        expect(onOpenFinalizeAppointment).toHaveBeenCalledWith(3);
        expect(updateStatusMock).not.toHaveBeenCalled();
        expect(cancelMock).not.toHaveBeenCalled();
    });
});
