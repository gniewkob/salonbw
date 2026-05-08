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

    it('scopes inline error to failed appointment row', async () => {
        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => undefined);

        updateStatusMock
            .mockRejectedValueOnce(new Error('Backend failed for first'))
            .mockResolvedValueOnce(undefined);

        render(
            <ReceptionView
                appointments={[
                    {
                        id: 20,
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
                    {
                        id: 21,
                        startTime: '2026-05-01T12:00:00.000Z',
                        endTime: '2026-05-01T12:45:00.000Z',
                        status: 'scheduled',
                        client: { id: 7, name: 'Kasia Kowal' },
                        service: {
                            id: 12,
                            name: 'Modelowanie',
                            duration: 45,
                            price: 150,
                            priceType: 'fixed',
                            isActive: true,
                            onlineBooking: true,
                            sortOrder: 0,
                        },
                        employee: { id: 4, name: 'Magda' },
                    },
                ]}
            />,
        );

        const confirmButtons = screen.getAllByRole('button', {
            name: 'Potwierdź',
        });
        fireEvent.click(confirmButtons[0]);

        await waitFor(() =>
            expect(
                screen.getByText(
                    /Wystąpił błąd podczas aktualizacji wizyty: Backend failed for first/i,
                ),
            ).toBeInTheDocument(),
        );

        fireEvent.click(confirmButtons[1]);

        await waitFor(() => expect(updateStatusMock).toHaveBeenCalledTimes(2));

        const rows = screen.getAllByRole('row');
        expect(rows[1]).toHaveTextContent(
            /Wystąpił błąd podczas aktualizacji wizyty: Backend failed for first/i,
        );
        expect(rows[2]).not.toHaveTextContent(
            /Wystąpił błąd podczas aktualizacji wizyty: Backend failed for first/i,
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

    it('shows operational summary metrics and CRM alert badge', () => {
        render(
            <ReceptionView
                appointments={[
                    {
                        id: 30,
                        startTime: new Date(
                            Date.now() - 60 * 60 * 1000,
                        ).toISOString(),
                        endTime: new Date(
                            Date.now() - 30 * 60 * 1000,
                        ).toISOString(),
                        status: 'scheduled',
                        client: { id: 10, name: 'Klient A' },
                        service: {
                            id: 20,
                            name: 'Usługa A',
                            duration: 30,
                            price: 100,
                            priceType: 'fixed',
                            isActive: true,
                            onlineBooking: true,
                            sortOrder: 0,
                        },
                        employee: { id: 5, name: 'Pracownik A' },
                    },
                    {
                        id: 31,
                        startTime: new Date(Date.now() + 60 * 60 * 1000)
                            .toISOString()
                            .toString(),
                        endTime: new Date(Date.now() + 90 * 60 * 1000)
                            .toISOString()
                            .toString(),
                        status: 'in_progress',
                        client: { id: 11, name: 'Klient B' },
                        service: {
                            id: 21,
                            name: 'Usługa B',
                            duration: 30,
                            price: 120,
                            priceType: 'fixed',
                            isActive: true,
                            onlineBooking: true,
                            sortOrder: 0,
                        },
                        employee: { id: 6, name: 'Pracownik B' },
                    },
                ]}
                customerAlertSeverityByCustomerId={{
                    10: 'danger',
                }}
            />,
        );

        expect(screen.getByText('Do finalizacji')).toBeInTheDocument();
        expect(screen.getByText('Z alertem CRM')).toBeInTheDocument();
        expect(screen.getByText('Opóźnione')).toBeInTheDocument();
        expect(screen.getByText('Alert CRM')).toBeInTheDocument();
    });

    it('opens appointment from reception row', () => {
        const onOpenAppointment = jest.fn();

        render(
            <ReceptionView
                appointments={[
                    {
                        id: 40,
                        startTime: '2026-05-01T12:00:00.000Z',
                        endTime: '2026-05-01T12:45:00.000Z',
                        status: 'scheduled',
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
                onOpenAppointment={onOpenAppointment}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Otwórz' }));
        expect(onOpenAppointment).toHaveBeenCalledWith(40);
    });
});
