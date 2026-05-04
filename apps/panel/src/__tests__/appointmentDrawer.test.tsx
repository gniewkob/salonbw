import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AppointmentDrawer from '@/components/calendar/AppointmentDrawer';

const apiFetchMock = jest.fn();
const cancelMock = jest.fn();
const completeMock = jest.fn();
const updateStatusMock = jest.fn();
const useWarehouseSalesMock = jest.fn();
const useCustomerAlertsMock = jest.fn();

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
    useCreateCustomer: () => ({
        mutateAsync: jest.fn(),
        isPending: false,
    }),
    useCustomerStatistics: () => ({
        data: null,
        isLoading: false,
    }),
}));

jest.mock('@/hooks/useAppointments', () => ({
    useAppointmentMutations: () => ({
        cancelAppointment: { mutateAsync: cancelMock },
        completeAppointment: { mutateAsync: completeMock },
        updateAppointmentStatus: { mutateAsync: updateStatusMock },
    }),
}));

jest.mock('@/hooks/useWarehouseViews', () => ({
    useWarehouseSales: (...args: unknown[]) => useWarehouseSalesMock(...args),
}));

jest.mock('@/hooks/useCustomerAlerts', () => ({
    useCustomerAlerts: (...args: unknown[]) => useCustomerAlertsMock(...args),
}));

jest.mock('@/components/calendar/FinalizationModal', () => ({
    __esModule: true,
    default: () => null,
}));

describe('AppointmentDrawer', () => {
    beforeEach(() => {
        apiFetchMock.mockReset();
        cancelMock.mockReset();
        completeMock.mockReset();
        updateStatusMock.mockReset();
        useWarehouseSalesMock.mockReset();
        useCustomerAlertsMock.mockReset();
        useWarehouseSalesMock.mockReturnValue({ data: { items: [] } });
        useCustomerAlertsMock.mockReturnValue({
            alerts: [],
            isLoading: false,
        });
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

    it('links to specific sale details when linkedSaleId exists', () => {
        useWarehouseSalesMock.mockReturnValue({
            data: { items: [{ id: 77 }] },
        });

        render(
            <AppointmentDrawer
                open
                mode="edit"
                appointment={{
                    id: 1,
                    startTime: '2026-05-01T10:00:00.000Z',
                    endTime: '2026-05-01T10:45:00.000Z',
                    status: 'completed',
                    paymentMethod: 'card',
                    paidAmount: 120,
                    finalizedAt: '2026-05-01T11:00:00.000Z',
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

        const link = screen.getByRole('link', { name: 'Szczegóły sprzedaży' });
        expect(link).toHaveAttribute('href', '/sales/history/77');
    });

    it('falls back to appointment-filtered sales history when no linkedSaleId', () => {
        useWarehouseSalesMock.mockReturnValueOnce({
            data: { items: [] },
        });

        render(
            <AppointmentDrawer
                open
                mode="edit"
                appointment={{
                    id: 42,
                    startTime: '2026-05-01T10:00:00.000Z',
                    endTime: '2026-05-01T10:45:00.000Z',
                    status: 'completed',
                    paymentMethod: 'cash',
                    paidAmount: 100,
                    finalizedAt: '2026-05-01T11:00:00.000Z',
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

        const link = screen.getByRole('link', { name: 'Historia sprzedaży' });
        expect(link).toHaveAttribute('href', '/sales/history?appointmentId=42');
    });

    it('renders customer alerts when available', () => {
        useCustomerAlertsMock.mockReturnValue({
            isLoading: false,
            alerts: [
                {
                    id: 'no-show',
                    severity: 'warning',
                    label: 'Historia no-show',
                    detail: 'Liczba nieobecności: 1',
                },
            ],
        });

        render(
            <AppointmentDrawer
                open
                mode="edit"
                appointment={{
                    id: 42,
                    startTime: '2026-05-01T10:00:00.000Z',
                    endTime: '2026-05-01T10:45:00.000Z',
                    status: 'completed',
                    paymentMethod: 'cash',
                    paidAmount: 100,
                    finalizedAt: '2026-05-01T11:00:00.000Z',
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

        expect(screen.getByText('Alerty klienta')).toBeInTheDocument();
        expect(screen.getByText(/Historia no-show/i)).toBeInTheDocument();
    });

    it('does not render customer alerts section when there are no alerts', () => {
        useCustomerAlertsMock.mockReturnValue({
            isLoading: false,
            alerts: [],
        });

        render(
            <AppointmentDrawer
                open
                mode="edit"
                appointment={{
                    id: 42,
                    startTime: '2026-05-01T10:00:00.000Z',
                    endTime: '2026-05-01T10:45:00.000Z',
                    status: 'completed',
                    paymentMethod: 'cash',
                    paidAmount: 100,
                    finalizedAt: '2026-05-01T11:00:00.000Z',
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

        expect(screen.queryByText('Alerty klienta')).not.toBeInTheDocument();
    });

    it('renders pinned medical/warning/preference alerts', () => {
        useCustomerAlertsMock.mockReturnValue({
            isLoading: false,
            alerts: [
                {
                    id: 'note-1',
                    severity: 'danger',
                    label: 'Notatka medyczna',
                    detail: 'Alergia na lateks',
                },
                {
                    id: 'note-2',
                    severity: 'warning',
                    label: 'Preferencja klienta',
                    detail: 'Bez amoniaku',
                },
            ],
        });

        render(
            <AppointmentDrawer
                open
                mode="edit"
                appointment={{
                    id: 52,
                    startTime: '2026-05-01T10:00:00.000Z',
                    endTime: '2026-05-01T10:45:00.000Z',
                    status: 'completed',
                    paymentMethod: 'cash',
                    paidAmount: 100,
                    finalizedAt: '2026-05-01T11:00:00.000Z',
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

        expect(screen.getByText('Notatka medyczna')).toBeInTheDocument();
        expect(screen.getAllByText(/Alergia na lateks/i).length).toBeGreaterThan(
            0,
        );
        expect(screen.getByText('Preferencja klienta')).toBeInTheDocument();
    });
});
