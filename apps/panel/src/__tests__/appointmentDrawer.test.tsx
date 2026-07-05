import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import AppointmentDrawer from '@/components/calendar/AppointmentDrawer';

const apiFetchMock = jest.fn();
const cancelMock = jest.fn();
const completeMock = jest.fn();
const updateStatusMock = jest.fn();
const useWarehouseSalesMock = jest.fn();
const useCustomerAlertsMock = jest.fn();
const trackEventMock = jest.fn();

jest.mock('@/utils/analytics', () => ({
    trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ apiFetch: apiFetchMock }),
}));

const MOCK_SERVICES = {
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
};
jest.mock('@/hooks/useServices', () => ({
    useServices: () => MOCK_SERVICES,
    useActiveServices: () => MOCK_SERVICES,
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

jest.mock('@/hooks/useCalendar', () => ({
    useCalendarMutations: () => ({
        checkConflicts: jest.fn(() =>
            Promise.resolve({ hasConflict: false, conflictingEvents: [] }),
        ),
    }),
}));

jest.mock('@/hooks/useCustomerAlerts', () => ({
    useCustomerAlerts: (...args: unknown[]) => useCustomerAlertsMock(...args),
}));

jest.mock('@/components/calendar/FinalizationModal', () => ({
    __esModule: true,
    default: () => null,
}));

describe('AppointmentDrawer', () => {
    const buildAppointment = (status: string) => ({
        id: 42,
        startTime: '2026-05-01T10:00:00.000Z',
        endTime: '2026-05-01T10:45:00.000Z',
        status,
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
    });

    beforeEach(() => {
        apiFetchMock.mockReset();
        cancelMock.mockReset();
        completeMock.mockReset();
        updateStatusMock.mockReset();
        useWarehouseSalesMock.mockReset();
        useCustomerAlertsMock.mockReset();
        trackEventMock.mockReset();
        // Default: resolve with empty array so formula/notes fetch in useEffect
        // doesn't throw TypeError when apiFetch returns undefined after reset.
        apiFetchMock.mockResolvedValue([]);
        useWarehouseSalesMock.mockReturnValue({ data: { items: [] } });
        useCustomerAlertsMock.mockReturnValue({
            alerts: [],
            isLoading: false,
        });
    });

    const renderDrawer = async (
        ui: ReactElement,
        options?: { waitForFormulas?: boolean },
    ) => {
        const view = render(ui);
        if (options?.waitForFormulas) {
            await waitFor(() =>
                expect(apiFetchMock).toHaveBeenCalledWith(
                    expect.stringMatching(/^\/customers\/\d+\/formulas$/),
                ),
            );
        }
        return view;
    };

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
        // ServiceCombobox: focus opens dropdown, then click the service option.
        fireEvent.focus(screen.getByLabelText('Usługa'));
        fireEvent.click(screen.getByRole('option', { name: /Strzyżenie/ }));

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

    it('links to specific sale details when linkedSaleId exists', async () => {
        useWarehouseSalesMock.mockReturnValue({
            data: { items: [{ id: 77 }] },
        });

        await renderDrawer(
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
            { waitForFormulas: true },
        );

        const link = screen.getByRole('link', { name: 'Szczegóły sprzedaży' });
        expect(link).toHaveAttribute('href', '/sales/history/77');
    });

    it('falls back to appointment-filtered sales history when no linkedSaleId', async () => {
        useWarehouseSalesMock.mockReturnValueOnce({
            data: { items: [] },
        });

        await renderDrawer(
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
            { waitForFormulas: true },
        );

        const link = screen.getByRole('link', { name: 'Historia sprzedaży' });
        expect(link).toHaveAttribute('href', '/sales/history?appointmentId=42');
    });

    it('renders customer alerts when available', async () => {
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

        await renderDrawer(
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
            { waitForFormulas: true },
        );

        expect(screen.getByText('Alerty')).toBeInTheDocument();
        expect(screen.getByText(/Historia no-show/i)).toBeInTheDocument();
    });

    it('does not render customer alerts section when there are no alerts', async () => {
        useCustomerAlertsMock.mockReturnValue({
            isLoading: false,
            alerts: [],
        });

        await renderDrawer(
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
            { waitForFormulas: true },
        );

        expect(screen.queryByText('Alerty')).not.toBeInTheDocument();
    });

    it('renders pinned medical/warning/preference alerts', async () => {
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

        await renderDrawer(
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
            { waitForFormulas: true },
        );

        expect(screen.getByText('Notatka medyczna')).toBeInTheDocument();
        expect(
            screen.getAllByText(/Alergia na lateks/i).length,
        ).toBeGreaterThan(0);
        expect(screen.getByText('Preferencja klienta')).toBeInTheDocument();
    });

    it('shows scheduled actions for scheduled appointment', () => {
        render(
            <AppointmentDrawer
                open
                mode="edit"
                appointment={buildAppointment('scheduled')}
                onSaved={jest.fn()}
                onClose={jest.fn()}
            />,
        );

        expect(screen.getByRole('button', { name: 'Potwierdź' })).toBeVisible();
        expect(
            screen.getByRole('button', { name: 'Rozpocznij' }),
        ).toBeVisible();
        expect(screen.getByRole('button', { name: 'No-show' })).toBeVisible();
        expect(
            screen.getByRole('button', { name: 'Anuluj wizytę' }),
        ).toBeVisible();
        expect(
            screen.queryByRole('button', { name: 'Finalizuj wizytę' }),
        ).not.toBeInTheDocument();
    });

    it('shows confirmed actions for confirmed appointment', () => {
        render(
            <AppointmentDrawer
                open
                mode="edit"
                appointment={buildAppointment('confirmed')}
                onSaved={jest.fn()}
                onClose={jest.fn()}
            />,
        );

        expect(
            screen.queryByRole('button', { name: 'Potwierdź' }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Rozpocznij' }),
        ).toBeVisible();
        expect(screen.getByRole('button', { name: 'No-show' })).toBeVisible();
        expect(
            screen.getByRole('button', { name: 'Anuluj wizytę' }),
        ).toBeVisible();
        expect(
            screen.queryByRole('button', { name: 'Finalizuj wizytę' }),
        ).not.toBeInTheDocument();
    });

    it('shows finalize action only for in_progress appointment', async () => {
        await renderDrawer(
            <AppointmentDrawer
                open
                mode="edit"
                appointment={buildAppointment('in_progress')}
                onSaved={jest.fn()}
                onClose={jest.fn()}
            />,
            { waitForFormulas: true },
        );

        expect(
            screen.queryByRole('button', { name: 'Potwierdź' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Rozpocznij' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'No-show' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Anuluj wizytę' }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Finalizuj wizytę' }),
        ).toBeVisible();
    });

    it('hides status actions for completed appointment', async () => {
        await renderDrawer(
            <AppointmentDrawer
                open
                mode="edit"
                appointment={buildAppointment('completed')}
                onSaved={jest.fn()}
                onClose={jest.fn()}
            />,
            { waitForFormulas: true },
        );

        expect(
            screen.queryByRole('button', { name: 'Potwierdź' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Rozpocznij' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'No-show' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Finalizuj wizytę' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Anuluj wizytę' }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: /sprzedaży|historia sprzedaży/i }),
        ).toBeVisible();
    });

    it('renders operational sections in edit mode', async () => {
        const { container } = await renderDrawer(
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
            { waitForFormulas: true },
        );

        expect(screen.getByText('Wizyta')).toBeInTheDocument();
        expect(screen.getAllByText('Klient').length).toBeGreaterThan(0);
        expect(screen.getByText('Sprzedaż')).toBeInTheDocument();
        expect(screen.getByText('Akcje')).toBeInTheDocument();

        const sectionHeadings = Array.from(
            container.querySelectorAll('strong.d-block.mb-2'),
        ).map((element) => element.textContent?.trim());
        expect(sectionHeadings).toEqual([
            'Wizyta',
            'Klient',
            'Wiadomości z klientką',
            'Formularz zabiegu',
            'Sprzedaż',
            'Akcje',
        ]);
    });

    it('tracks CRM alert severity for drawer actions when alerts exist', async () => {
        useCustomerAlertsMock.mockReturnValue({
            isLoading: false,
            alerts: [
                {
                    id: 'note-1',
                    severity: 'danger',
                    label: 'Notatka medyczna',
                    detail: 'Alergia na lateks',
                },
            ],
        });

        await renderDrawer(
            <AppointmentDrawer
                open
                mode="edit"
                appointment={buildAppointment('completed')}
                onSaved={jest.fn()}
                onClose={jest.fn()}
            />,
            { waitForFormulas: true },
        );

        fireEvent.click(
            screen.getByRole('link', { name: 'Historia sprzedaży' }),
        );

        expect(trackEventMock).toHaveBeenCalledWith(
            'reception_operational_action',
            expect.objectContaining({
                action: 'open_sale_detail',
                appointmentId: 42,
                customerId: 5,
                customerAlertSeverity: 'danger',
                source: 'appointment_drawer',
            }),
        );
    });

    it('does not track CRM alert severity for drawer actions without alerts', async () => {
        await renderDrawer(
            <AppointmentDrawer
                open
                mode="edit"
                appointment={buildAppointment('completed')}
                onSaved={jest.fn()}
                onClose={jest.fn()}
            />,
            { waitForFormulas: true },
        );

        fireEvent.click(
            screen.getByRole('link', { name: 'Historia sprzedaży' }),
        );

        expect(trackEventMock).toHaveBeenCalledWith(
            'reception_operational_action',
            expect.objectContaining({
                action: 'open_sale_detail',
                appointmentId: 42,
                customerId: 5,
                source: 'appointment_drawer',
            }),
        );
        expect(trackEventMock.mock.calls[0][1]).not.toHaveProperty(
            'customerAlertSeverity',
        );
    });
});
