import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductForm from '@/components/ProductForm';

describe('ProductForm', () => {
    it('validates fields', async () => {
        const onSubmit = jest.fn();
        render(<ProductForm onSubmit={onSubmit} onCancel={() => {}} />);
        fireEvent.click(screen.getByRole('button', { name: /zapisz/i }));
        expect(await screen.findByRole('alert')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits valid data', async () => {
        const onSubmit = jest.fn().mockResolvedValue(undefined);
        render(<ProductForm onSubmit={onSubmit} onCancel={() => {}} />);
        fireEvent.change(screen.getByPlaceholderText('Nazwa'), {
            target: { value: 'P' },
        });
        fireEvent.change(screen.getByPlaceholderText('Cena'), {
            target: { value: '1' },
        });
        fireEvent.change(screen.getByPlaceholderText('Stan magazynowy'), {
            target: { value: '2' },
        });
        // lowStockThreshold left as default (5)
        fireEvent.click(screen.getByRole('button', { name: /zapisz/i }));
        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith({
                name: 'P',
                unitPrice: 1,
                stock: 2,
                lowStockThreshold: 5,
                brand: '',
            }),
        );
    });
});
