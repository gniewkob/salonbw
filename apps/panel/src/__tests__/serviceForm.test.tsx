import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ServiceForm from '@/components/ServiceForm';

describe('ServiceForm', () => {
    it('validates name', async () => {
        const onSubmit = jest.fn();
        render(<ServiceForm onSubmit={onSubmit} onCancel={() => {}} />);
        fireEvent.click(screen.getByRole('button', { name: /zapisz/i }));
        expect(await screen.findByRole('alert')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits valid data', async () => {
        const onSubmit = jest.fn().mockResolvedValue(undefined);
        render(<ServiceForm onSubmit={onSubmit} onCancel={() => {}} />);
        fireEvent.change(screen.getByPlaceholderText('Nazwa usługi'), {
            target: { value: 'S' },
        });
        fireEvent.click(screen.getByRole('button', { name: /zapisz/i }));
        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith({ name: 'S' }),
        );
    });
});
