import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import SaleForm from '@/components/SaleForm';

const mockProducts = [
    {
        id: 1,
        name: 'Product A',
        unitPrice: 10,
        stock: 5,
        brand: 'B',
        lowStockThreshold: 2,
    },
    {
        id: 2,
        name: 'Product B',
        unitPrice: 20,
        stock: 3,
        brand: 'B',
        lowStockThreshold: 2,
    },
];

const mockEmployees = [{ id: 1, name: 'Employee A' }];

const mockAppointments = [
    {
        id: 1,
        startTime: '2025-01-15T10:00:00.000Z',
        client: { id: 1, name: 'John Doe' },
        service: { id: 1, name: 'Haircut', duration: 30, price: 50 },
        employee: { id: 1, name: 'Employee A' },
        paymentStatus: 'pending',
    },
];

describe('SaleForm', () => {
    it('validates required fields', async () => {
        const onSubmit = jest.fn();
        render(
            <SaleForm
                products={mockProducts}
                employees={mockEmployees}
                appointments={mockAppointments}
                onSubmit={onSubmit}
                onCancel={() => {}}
            />,
        );

        const quantityInput = screen.getByPlaceholderText('Quantity');
        fireEvent.change(quantityInput, { target: { value: '' } });
        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        expect(await screen.findByRole('alert')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits valid data with required fields only', async () => {
        const onSubmit = jest.fn().mockResolvedValue(undefined);
        render(
            <SaleForm
                products={mockProducts}
                employees={mockEmployees}
                appointments={mockAppointments}
                onSubmit={onSubmit}
                onCancel={() => {}}
            />,
        );

        const quantityInput = screen.getByPlaceholderText('Quantity');
        fireEvent.change(quantityInput, { target: { value: '2' } });
        fireEvent.change(screen.getByPlaceholderText('Unit price override'), {
            target: { value: '' },
        });
        fireEvent.change(screen.getByPlaceholderText('Discount'), {
            target: { value: '' },
        });

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith({
                productId: 1,
                quantity: 2,
                employeeId: undefined,
                appointmentId: undefined,
                unitPrice: undefined,
                discount: undefined,
                note: undefined,
            }),
        );
    });

    it('submits with all optional fields', async () => {
        const onSubmit = jest.fn().mockResolvedValue(undefined);
        render(
            <SaleForm
                products={mockProducts}
                employees={mockEmployees}
                appointments={mockAppointments}
                onSubmit={onSubmit}
                onCancel={() => {}}
            />,
        );

        const quantityInput = screen.getByPlaceholderText('Quantity');
        fireEvent.change(quantityInput, { target: { value: '3' } });

        fireEvent.mouseDown(screen.getByTestId('employee-select'));
        fireEvent.click(await screen.findByTestId('employee-option-1'));

        fireEvent.mouseDown(screen.getByTestId('appointment-select'));
        fireEvent.click(await screen.findByTestId('appointment-option-1'));

        fireEvent.change(screen.getByPlaceholderText('Unit price override'), {
            target: { value: '12.50' },
        });
        fireEvent.change(screen.getByPlaceholderText('Discount'), {
            target: { value: '1.5' },
        });
        fireEvent.change(screen.getByPlaceholderText('Note'), {
            target: { value: 'Special request' },
        });

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith({
                productId: 1,
                quantity: 3,
                employeeId: 1,
                appointmentId: 1,
                unitPrice: 12.5,
                discount: 1.5,
                note: 'Special request',
            }),
        );
    });

    it('shows error on submission failure', async () => {
        const onSubmit = jest
            .fn()
            .mockRejectedValue(new Error('Failed to save sale'));
        render(
            <SaleForm
                products={mockProducts}
                employees={mockEmployees}
                appointments={mockAppointments}
                onSubmit={onSubmit}
                onCancel={() => {}}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /save/i }));
        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Failed to save sale',
        );
    });

    it('disables submit button while submitting', async () => {
        jest.useFakeTimers();
        const onSubmit = jest.fn(
            () =>
                new Promise<void>((resolve) => {
                    setTimeout(resolve, 100);
                }),
        );
        render(
            <SaleForm
                products={mockProducts}
                employees={mockEmployees}
                appointments={mockAppointments}
                onSubmit={onSubmit}
                onCancel={() => {}}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() =>
            expect(
                screen.getByRole('button', { name: /saving/i }),
            ).toBeDisabled(),
        );

        await act(async () => {
            jest.runAllTimers();
        });
        jest.useRealTimers();
    });
});
