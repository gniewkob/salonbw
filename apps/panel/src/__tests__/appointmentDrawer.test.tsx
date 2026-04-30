import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AppointmentDrawer from '@/components/calendar/AppointmentDrawer';

const apiFetchMock = jest.fn();
const cancelMock = jest.fn();
const completeMock = jest.fn();
const updateStatusMock = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ apiFetch: apiFetchMock }),
}));

jest.mock('@/hooks/useServices', () => ({
    useServices: () => ({
        data: [
            {
                id: 10,
                name: 'Strzyżenie',
                duration: 45,
                price: 120,
                priceType: 'fixed',
                isActive: true,
                onlineBooking: true,
                sortOrder: 0,
            },
        ],
    }),
}));

jest.mock('@/hooks/useEmployees', () => ({
    useEmployees: () => ({
        data: [{ id: 2, name: 'Anna' }],
    }),
}));

jest.mock('@/hooks/useCustomers', () => ({
    useCustomers: () => ({
        data: {
            items: [{ id: 5, name: 'Jan Kowalski', fullName: 'Jan Kowalski' }],
        },
    }),
}));

jest.mock('@/hooks/useAppointments', () => ({
    useAppointmentMutations: () => ({
        cancelAppointment: { mutateAsync: cancelMock },
        completeAppointment: { mutateAsync: completeMock },
        updateAppointmentStatus: { mutateAsync: updateStatusMock },
    }),
}));

describe('AppointmentDrawer', () => {
    beforeEach(() => {
        apiFetchMock.mockReset();
        cancelMock.mockReset();
        completeMock.mockReset();
        updateStatusMock.mockReset();
    });

    it('creates appointment in create mode', async () => {
        const onSaved = jest.fn();
        const onClose = jest.fn();
        apiFetchMock.mockResolvedValueOnce({ id: 999 });

        render(
            <AppointmentDrawer
                open
                mode="create"
                initialStartTime={new Date('2026-05-01T10:00:00')}
                onSaved={onSaved}
                onClose={onClose}
            />,
        );

        fireEvent.change(screen.getByLabelText('Pracownik'), {
            target: { value: '2' },
        });
        fireEvent.change(screen.getByLabelText('Klient'), {
            target: { value: '5' },
        });
        fireEvent.change(screen.getByLabelText('Usługa'), {
            target: { value: '10' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Utwórz wizytę' }));

        await waitFor(() => expect(apiFetchMock).toHaveBeenCalled());
        expect(apiFetchMock).toHaveBeenCalledWith(
            '/appointments',
            expect.objectContaining({ method: 'POST' }),
        );
        expect(onSaved).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });

    it('changes status to confirmed in edit mode', async () => {
        updateStatusMock.mockResolvedValueOnce({ id: 1, status: 'confirmed' });

        render(
            <AppointmentDrawer
                open
                mode="edit"
                appointment={{
                    id: 1,
                    startTime: '2026-05-01T10:00:00.000Z',
                    endTime: '2026-05-01T10:45:00.000Z',
                    status: 'scheduled',
                    employee: { id: 2, name: 'Anna' },
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
                }}
                onSaved={jest.fn()}
                onClose={jest.fn()}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Potwierdź' }));

        await waitFor(() => expect(updateStatusMock).toHaveBeenCalled());
        expect(updateStatusMock).toHaveBeenCalledWith({
            id: 1,
            status: 'confirmed',
        });
    });
});
