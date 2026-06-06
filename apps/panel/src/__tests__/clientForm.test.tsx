import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientForm from '@/components/ClientForm';

describe('ClientForm', () => {
    it('validates name', async () => {
        const onSubmit = jest.fn();
        render(<ClientForm onSubmit={onSubmit} onCancel={() => {}} />);
        fireEvent.click(screen.getByRole('button', { name: /zapisz/i }));
        expect(await screen.findByRole('alert')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits valid data', async () => {
        const onSubmit = jest.fn().mockResolvedValue(undefined);
        render(<ClientForm onSubmit={onSubmit} onCancel={() => {}} />);
        fireEvent.change(screen.getByPlaceholderText('Nazwa'), {
            target: { value: 'Jan' },
        });
        fireEvent.click(screen.getByRole('button', { name: /zapisz/i }));
        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith({ name: 'Jan' }),
        );
    });
});
