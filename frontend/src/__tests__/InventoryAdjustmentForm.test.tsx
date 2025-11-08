import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import InventoryAdjustmentForm from '@/components/InventoryAdjustmentForm';

const mockProducts = [
    {
        id: 1,
        name: 'Product A',
        unitPrice: 10,
        stock: 5,
        brand: 'B',
        lowStockThreshold: 2,
    },
];

describe('InventoryAdjustmentForm', () => {
    it('validates required fields', async () => {
        const onSubmit = jest.fn();
        render(
            <InventoryAdjustmentForm
                products={mockProducts}
                onSubmit={onSubmit}
                onCancel={() => {}}
            />,
        );

        fireEvent.change(screen.getByPlaceholderText('Delta'), {
            target: { value: '' },
        });
        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        expect(await screen.findByRole('alert')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits valid data with positive delta', async () => {
        const onSubmit = jest.fn().mockResolvedValue(undefined);
        render(
            <InventoryAdjustmentForm
                products={mockProducts}
                onSubmit={onSubmit}
                onCancel={() => {}}
            />,
        );

        fireEvent.change(screen.getByPlaceholderText('Delta'), {
            target: { value: '5' },
        });
        fireEvent.change(screen.getByTestId('reason-select'), {
            target: { value: 'delivery' },
        });
        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith({
                productId: 1,
                delta: 5,
                reason: 'delivery',
                note: undefined,
            }),
        );
    });

    it('submits valid data with negative delta', async () => {
        const onSubmit = jest.fn().mockResolvedValue(undefined);
        render(
            <InventoryAdjustmentForm
                products={mockProducts}
                onSubmit={onSubmit}
                onCancel={() => {}}
            />,
        );

        fireEvent.change(screen.getByPlaceholderText('Delta'), {
            target: { value: '-3' },
        });
        fireEvent.change(screen.getByTestId('reason-select'), {
            target: { value: 'sale' },
        });
        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith({
                productId: 1,
                delta: -3,
                reason: 'sale',
                note: undefined,
            }),
        );
    });

    it('submits with optional note', async () => {
        const onSubmit = jest.fn().mockResolvedValue(undefined);
        render(
            <InventoryAdjustmentForm
                products={mockProducts}
                onSubmit={onSubmit}
                onCancel={() => {}}
            />,
        );

        fireEvent.change(screen.getByPlaceholderText('Delta'), {
            target: { value: '7' },
        });
        fireEvent.change(screen.getByTestId('reason-select'), {
            target: { value: 'correction' },
        });
        fireEvent.change(screen.getByPlaceholderText('Note (optional)'), {
            target: { value: 'Batch received' },
        });
        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith({
                productId: 1,
                delta: 7,
                reason: 'correction',
                note: 'Batch received',
            }),
        );
    });

    it('shows error on submission failure', async () => {
        const onSubmit = jest
            .fn()
            .mockRejectedValue(new Error('Failed to adjust inventory'));
        render(
            <InventoryAdjustmentForm
                products={mockProducts}
                onSubmit={onSubmit}
                onCancel={() => {}}
            />,
        );

        fireEvent.change(screen.getByPlaceholderText('Delta'), {
            target: { value: '2' },
        });
        fireEvent.change(screen.getByTestId('reason-select'), {
            target: { value: 'damage' },
        });
        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Failed to adjust inventory',
        );
    });

    it('validates reason enum', async () => {
        const onSubmit = jest.fn();
        render(
            <InventoryAdjustmentForm
                products={mockProducts}
                onSubmit={onSubmit}
                onCancel={() => {}}
            />,
        );

        fireEvent.change(screen.getByPlaceholderText('Delta'), {
            target: { value: '4' },
        });
        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Reason is required',
        );
        expect(onSubmit).not.toHaveBeenCalled();
    });
});
